import {
  DEFAULT_BUSINESS_SYSTEM_SEED,
  moduleDeletionBlockersSchema,
} from '@ai-design/contracts/workspace'
import type {
  BusinessSystem,
  DesignProject,
  ProjectPageRecord,
  PublicModuleRecord,
  PublicModuleVersionList,
  TrashItem,
} from '@ai-design/contracts/workspace'
import { deepClone } from '@vunio/utils'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/client.ts'
import { createPublicModuleSchema } from '@/schema/createModule.ts'
import { createPageSchema } from '@/schema/createPage.ts'
import { isSamePublicModuleContent, MODULE_DRAFT_VERSION } from '@/schema/module.ts'
import type { PublicModuleSchema } from '@/schema/module.ts'
import type { PageSchema } from '@/schema/page.ts'
import * as workspaceApi from './api.ts'
import { compareWorkspaceTimeDescending } from './time.ts'

export type WorkspaceStatus = 'idle' | 'loading' | 'ready' | 'error'
export type ModuleReferenceBlockerKind = 'trash' | 'history' | 'module' | 'unknown'

interface ProjectAssetLoad {
  token: symbol
  promise: Promise<void>
}

interface ModuleVersionLoad {
  token: symbol
  promise: Promise<void>
}

function referencedModuleIds(schema: PageSchema) {
  const ids = new Set<string>()
  const visit = (nodes: PageSchema['root']['children']) => {
    nodes.forEach((node) => {
      if (node.type === 'project-module-instance' && typeof node.props.moduleId === 'string') {
        ids.add(node.props.moduleId)
      }
      visit(node.children)
    })
  }
  visit(schema.root.children)
  return ids
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const currentWorkspaceId = ref('')
  const systems = ref<BusinessSystem[]>([])
  const projects = ref<DesignProject[]>([])
  const pages = ref<ProjectPageRecord[]>([])
  const modules = ref<PublicModuleRecord[]>([])
  const trashItems = ref<TrashItem[]>([])
  const trashRetentionDays = ref<number>()
  const selectedSystemId = ref('')
  const status = ref<WorkspaceStatus>('idle')
  const errorMessage = ref('')
  const loadedProjectIds = new Set<string>()
  const projectAssetLoads = new Map<string, ProjectAssetLoad>()
  const loadedModuleVersionProjectIds = new Set<string>()
  const moduleVersionLoads = new Map<string, ModuleVersionLoad>()
  let initializedForUserId = ''
  let initialization: Promise<void> | undefined
  let initializationToken: symbol | undefined
  // 本地页面/模块变更的单调版本号，用于识别加载期间快照是否已过期
  let assetMutationEpoch = 0

  function noteLocalAssetMutation() {
    assetMutationEpoch += 1
  }

  async function initialize(userId: string, force = false) {
    if (!force && status.value === 'ready' && initializedForUserId === userId) return
    if (!force && initialization && initializedForUserId === userId) return initialization

    if (initializedForUserId !== userId) reset()
    initializedForUserId = userId
    status.value = 'loading'
    errorMessage.value = ''
    const token = Symbol()
    initializationToken = token
    const request = (async () => {
      try {
        const nextWorkspaces = await workspaceApi.listWorkspaces()
        const workspace = nextWorkspaces[0]
        if (!workspace) {
          if (initializationToken !== token || initializedForUserId !== userId) return
          currentWorkspaceId.value = ''
          systems.value = []
          projects.value = []
          pages.value = []
          modules.value = []
          selectedSystemId.value = ''
          loadedProjectIds.clear()
          projectAssetLoads.clear()
          status.value = 'ready'
          return
        }

        const bootstrap = await workspaceApi.getWorkspaceBootstrap(workspace.id)
        if (initializationToken !== token || initializedForUserId !== userId) return
        currentWorkspaceId.value = bootstrap.workspace.id
        systems.value = bootstrap.systems
        projects.value = bootstrap.projects
        selectedSystemId.value =
          bootstrap.systems.find((system) => system.id === selectedSystemId.value)?.id ??
          bootstrap.systems[0]?.id ??
          ''
        status.value = 'ready'
      } catch (error) {
        if (initializationToken !== token || initializedForUserId !== userId) return
        status.value = 'error'
        errorMessage.value = error instanceof Error ? error.message : '工作区加载失败'
        throw error
      } finally {
        if (initializationToken === token) {
          initialization = undefined
          initializationToken = undefined
        }
      }
    })()
    initialization = request
    return request
  }

  function reset() {
    currentWorkspaceId.value = ''
    systems.value = []
    projects.value = []
    pages.value = []
    modules.value = []
    trashItems.value = []
    trashRetentionDays.value = undefined
    selectedSystemId.value = ''
    status.value = 'idle'
    errorMessage.value = ''
    loadedProjectIds.clear()
    projectAssetLoads.clear()
    loadedModuleVersionProjectIds.clear()
    moduleVersionLoads.clear()
    initializedForUserId = ''
    initialization = undefined
    initializationToken = undefined
  }

  function selectSystem(systemId: string) {
    if (systems.value.some((system) => system.id === systemId)) selectedSystemId.value = systemId
  }

  async function loadProjectAssets(projectId: string, force = false): Promise<void> {
    if (!force && loadedProjectIds.has(projectId)) return
    const pendingLoad = projectAssetLoads.get(projectId)
    if (!force && pendingLoad) return pendingLoad.promise

    const token = Symbol()
    const epochAtStart = assetMutationEpoch
    let discarded = false
    const request = workspaceApi.getProjectAssets(projectId).then((assets) => {
      if (projectAssetLoads.get(projectId)?.token !== token) return
      // 拉取期间本地已有更新的变更（如新建页面），直接合并会覆盖掉它们，丢弃快照
      if (assetMutationEpoch !== epochAtStart) {
        discarded = true
        return
      }
      pages.value = [...pages.value.filter((page) => page.projectId !== projectId), ...assets.pages]
      modules.value = [
        ...modules.value.filter((publicModule) => publicModule.projectId !== projectId),
        ...assets.modules.map(mergeModuleVersions),
      ]
      loadedProjectIds.add(projectId)
    })
    projectAssetLoads.set(projectId, { token, promise: request })
    try {
      await request
    } finally {
      if (projectAssetLoads.get(projectId)?.token === token) projectAssetLoads.delete(projectId)
    }
    if (discarded) await loadProjectAssets(projectId, true)
  }

  function replaceProjectModuleVersions(
    projectId: string,
    versionLists: PublicModuleVersionList[],
  ): boolean {
    const projectModules = modules.value.filter(
      (publicModule) => publicModule.projectId === projectId,
    )
    if (projectModules.length !== versionLists.length) return false

    const versionsByModuleId = new Map(
      versionLists.map((versionList) => [versionList.moduleId, versionList]),
    )
    const hasMatchingMetadata = projectModules.every((publicModule) => {
      const versionList = versionsByModuleId.get(publicModule.id)
      return (
        versionList?.revision === publicModule.revision &&
        versionList.publishedVersionId === publicModule.publishedVersionId
      )
    })
    if (!hasMatchingMetadata) return false

    modules.value = modules.value.map((publicModule) =>
      publicModule.projectId === projectId
        ? {
            ...publicModule,
            versions: versionsByModuleId.get(publicModule.id)!.versions,
          }
        : publicModule,
    )
    return true
  }

  async function loadProjectModuleVersions(projectId: string, force = false): Promise<void> {
    if (!force && loadedModuleVersionProjectIds.has(projectId)) return
    const pendingLoad = moduleVersionLoads.get(projectId)
    if (!force && pendingLoad) return pendingLoad.promise

    const token = Symbol()
    const isCurrentRequest = () => moduleVersionLoads.get(projectId)?.token === token
    const request = (async () => {
      let versionLists = await workspaceApi.listModuleVersions(projectId)
      if (!isCurrentRequest()) return

      if (!replaceProjectModuleVersions(projectId, versionLists)) {
        await loadProjectAssets(projectId, true)
        if (!isCurrentRequest()) return
        versionLists = await workspaceApi.listModuleVersions(projectId)
        if (!isCurrentRequest()) return
        if (!replaceProjectModuleVersions(projectId, versionLists)) {
          throw new Error('模块在加载期间发生变化，请重新打开后重试')
        }
      }
      loadedModuleVersionProjectIds.add(projectId)
    })()
    moduleVersionLoads.set(projectId, { token, promise: request })
    try {
      await request
    } finally {
      if (moduleVersionLoads.get(projectId)?.token === token) {
        moduleVersionLoads.delete(projectId)
      }
    }
  }

  function getProject(projectId: string) {
    return projects.value.find((project) => project.id === projectId)
  }

  function getPage(pageId: string) {
    return pages.value.find((page) => page.id === pageId)
  }

  function getProjectPages(projectId: string) {
    return pages.value
      .filter((page) => page.projectId === projectId)
      .sort((left, right) => compareWorkspaceTimeDescending(left.updatedAt, right.updatedAt))
  }

  function getProjectModules(projectId: string) {
    return modules.value
      .filter((publicModule) => publicModule.projectId === projectId)
      .sort((left, right) => compareWorkspaceTimeDescending(left.updatedAt, right.updatedAt))
  }

  function getModuleReferences(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return []
    return getProjectPages(publicModule.projectId).filter((page) =>
      referencedModuleIds(page.schema).has(moduleId),
    )
  }

  function replaceProject(project: DesignProject) {
    const index = projects.value.findIndex((candidate) => candidate.id === project.id)
    if (index >= 0) {
      // 并发操作的响应可能乱序到达，丢弃比本地更旧的快照
      if (project.updatedAt < projects.value[index]!.updatedAt) return
      projects.value[index] = project
    } else {
      projects.value.unshift(project)
    }
  }

  function mergeModuleVersions(publicModule: PublicModuleRecord): PublicModuleRecord {
    const current = modules.value.find((candidate) => candidate.id === publicModule.id)
    if (!current) return publicModule
    const versions = new Map(current.versions.map((version) => [version.id, version]))
    publicModule.versions.forEach((version) => versions.set(version.id, version))
    return {
      ...publicModule,
      versions: [...versions.values()].sort((left, right) =>
        left.version.localeCompare(right.version, undefined, { numeric: true }),
      ),
    }
  }

  async function reloadAfterConflict(error: unknown, projectId: string) {
    // 乐观锁冲突说明服务端数据已领先本地，强制刷新资产以便用户基于最新版本重试
    if (error instanceof ApiError && error.status === 409) {
      await loadProjectAssets(projectId, true).catch(() => undefined)
    }
  }

  function applyModuleReferenceCounts(
    referenceCounts: Array<{ moduleId: string; referenceCount: number }>,
  ) {
    const countByModuleId = new Map(
      referenceCounts.map(({ moduleId, referenceCount }) => [moduleId, referenceCount]),
    )
    modules.value.forEach((publicModule) => {
      const referenceCount = countByModuleId.get(publicModule.id)
      if (referenceCount !== undefined) publicModule.referenceCount = referenceCount
    })
  }

  async function addSystem(name: string, description: string) {
    const system = await workspaceApi.createSystem(currentWorkspaceId.value, {
      name,
      description,
      icon: DEFAULT_BUSINESS_SYSTEM_SEED.icon,
    })
    systems.value.push(system)
    selectedSystemId.value = system.id
    return system.id
  }

  async function updateSystem(
    systemId: string,
    details: Pick<BusinessSystem, 'name' | 'description'>,
  ) {
    const system = await workspaceApi.updateSystem(currentWorkspaceId.value, systemId, details)
    const index = systems.value.findIndex((candidate) => candidate.id === systemId)
    if (index >= 0) systems.value[index] = system
    return true
  }

  async function removeSystem(systemId: string) {
    await workspaceApi.deleteSystem(currentWorkspaceId.value, systemId)
    const projectIds = new Set(
      projects.value
        .filter((project) => project.systemId === systemId)
        .map((project) => project.id),
    )
    systems.value = systems.value.filter((system) => system.id !== systemId)
    projects.value = projects.value.filter((project) => !projectIds.has(project.id))
    pages.value = pages.value.filter((page) => !projectIds.has(page.projectId))
    modules.value = modules.value.filter((module) => !projectIds.has(module.projectId))
    projectIds.forEach((projectId) => {
      loadedProjectIds.delete(projectId)
      projectAssetLoads.delete(projectId)
      loadedModuleVersionProjectIds.delete(projectId)
      moduleVersionLoads.delete(projectId)
    })
    if (selectedSystemId.value === systemId) selectedSystemId.value = systems.value[0]?.id ?? ''
    return true
  }

  async function addProject(name: string) {
    const project = await workspaceApi.createProject(currentWorkspaceId.value, {
      systemId: selectedSystemId.value,
      name,
      description: '一个新的可视化设计项目',
    })
    projects.value.unshift(project)
    return project.id
  }

  async function renameProject(projectId: string, name: string) {
    replaceProject(await workspaceApi.updateProject(projectId, { name }))
  }

  async function removeProject(projectId: string) {
    await workspaceApi.deleteProject(projectId)
    projects.value = projects.value.filter((project) => project.id !== projectId)
    pages.value = pages.value.filter((page) => page.projectId !== projectId)
    modules.value = modules.value.filter((module) => module.projectId !== projectId)
    loadedProjectIds.delete(projectId)
    projectAssetLoads.delete(projectId)
    loadedModuleVersionProjectIds.delete(projectId)
    moduleVersionLoads.delete(projectId)
  }

  async function toggleProjectFavorite(projectId: string) {
    const project = getProject(projectId)
    if (!project) return
    replaceProject(
      await workspaceApi.updateProjectPreference(projectId, {
        isFavorite: !project.isFavorite,
      }),
    )
  }

  async function recordProjectVisit(projectId: string, pageId?: string) {
    const project = await workspaceApi.updateProjectPreference(projectId, {
      recordVisit: true,
      ...(pageId ? { lastEditedPageId: pageId } : {}),
    })
    replaceProject(project)
  }

  async function addPage(projectId: string, name: string) {
    const id = crypto.randomUUID()
    const response = await workspaceApi.createPage(projectId, {
      schema: createPageSchema({ id, name }),
    })
    const { page } = response
    noteLocalAssetMutation()
    pages.value.unshift(page)
    replaceProject(response.project)
    applyModuleReferenceCounts(response.moduleReferenceCounts)
    return page.id
  }

  async function addModule(projectId: string, name: string) {
    const id = crypto.randomUUID()
    const response = await workspaceApi.createModule(projectId, {
      schema: createPublicModuleSchema({ id, name }),
    })
    const publicModule = response.publicModule
    noteLocalAssetMutation()
    modules.value.unshift(publicModule)
    replaceProject(response.project)
    return publicModule.id
  }

  async function renamePage(pageId: string, name: string) {
    const page = getPage(pageId)
    if (!page) return
    const schema = deepClone(page.schema)
    schema.root.name = name
    await savePageSchema(pageId, schema)
  }

  async function renameModule(moduleId: string, name: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return
    const schema = deepClone(publicModule.schema)
    schema.root.name = name
    await saveModuleSchema(moduleId, schema)
  }

  async function savePageSchema(pageId: string, schema: PageSchema) {
    const page = getPage(pageId)
    if (!page || schema.id !== pageId) return
    try {
      const response = await workspaceApi.savePage(page.projectId, pageId, {
        schema,
        expectedRevision: page.revision,
      })
      noteLocalAssetMutation()
      const saved = response.page
      const index = pages.value.findIndex((candidate) => candidate.id === pageId)
      pages.value[index] = saved
      replaceProject(response.project)
      applyModuleReferenceCounts(response.moduleReferenceCounts)
      return saved.schema
    } catch (error) {
      await reloadAfterConflict(error, page.projectId)
      throw error
    }
  }

  async function saveModuleSchema(moduleId: string, schema: PublicModuleSchema) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule || schema.moduleId !== moduleId) return
    const { parsePublicModuleSchema } = await import('@/schema/validation.ts')
    const result = parsePublicModuleSchema(schema)
    if (!result.success || result.data.version !== MODULE_DRAFT_VERSION) return
    if (isSamePublicModuleContent(publicModule.schema, result.data)) return publicModule.schema

    try {
      const response = await workspaceApi.saveModule(publicModule.projectId, moduleId, {
        schema: result.data,
        expectedRevision: publicModule.revision,
      })
      noteLocalAssetMutation()
      const saved = response.publicModule
      const index = modules.value.findIndex((candidate) => candidate.id === moduleId)
      modules.value[index] = mergeModuleVersions(saved)
      replaceProject(response.project)
      return saved.schema
    } catch (error) {
      await reloadAfterConflict(error, publicModule.projectId)
      throw error
    }
  }

  async function publishModuleSchema(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return
    const previousVersion = publicModule.version
    try {
      const response = await workspaceApi.publishModule(
        publicModule.projectId,
        moduleId,
        publicModule.revision,
      )
      noteLocalAssetMutation()
      const published = response.publicModule
      const index = modules.value.findIndex((candidate) => candidate.id === moduleId)
      modules.value[index] = mergeModuleVersions(published)
      replaceProject(response.project)
      return {
        status:
          published.version === previousVersion ? ('unchanged' as const) : ('published' as const),
        version: published.version,
      }
    } catch (error) {
      await reloadAfterConflict(error, publicModule.projectId)
      throw error
    }
  }

  async function duplicatePage(pageId: string) {
    const page = getPage(pageId)
    if (!page) return
    const response = await workspaceApi.duplicatePage(page.projectId, pageId)
    const duplicated = response.page
    noteLocalAssetMutation()
    pages.value.unshift(duplicated)
    replaceProject(response.project)
    applyModuleReferenceCounts(response.moduleReferenceCounts)
    return duplicated.id
  }

  async function duplicateModule(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return
    const response = await workspaceApi.duplicateModule(publicModule.projectId, moduleId)
    const duplicated = response.publicModule
    noteLocalAssetMutation()
    modules.value.unshift(duplicated)
    replaceProject(response.project)
    return duplicated.id
  }

  async function removePage(pageId: string) {
    const page = getPage(pageId)
    if (!page) return
    const response = await workspaceApi.deletePage(page.projectId, pageId)
    noteLocalAssetMutation()
    pages.value = pages.value.filter((candidate) => candidate.id !== pageId)
    replaceProject(response.project)
    applyModuleReferenceCounts(response.moduleReferenceCounts)
  }

  async function removeModule(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return { status: 'not-found' as const }
    const references = getModuleReferences(moduleId)
    if (references.length) {
      return {
        status: 'referenced' as const,
        references,
        hasHiddenReferences: false,
        hiddenReferenceKinds: [] as ModuleReferenceBlockerKind[],
      }
    }

    let project: DesignProject
    try {
      project = await workspaceApi.deleteModule(publicModule.projectId, moduleId)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const blockers = moduleDeletionBlockersSchema.safeParse(error.payload?.blockers)
        if (!blockers.success) {
          return {
            status: 'referenced' as const,
            references: [],
            hasHiddenReferences: true,
            hiddenReferenceKinds: ['unknown'] as ModuleReferenceBlockerKind[],
          }
        }
        const activePageIds = new Set(blockers.data.activePageIds)
        const visibleReferences = pages.value.filter((page) => activePageIds.has(page.id))
        const hiddenReferenceKinds: ModuleReferenceBlockerKind[] = []
        if (blockers.data.trashedPageIds.length > 0 || blockers.data.trashedModuleIds.length > 0) {
          hiddenReferenceKinds.push('trash')
        }
        if (
          blockers.data.historicalPageIds.length > 0 ||
          blockers.data.historicalModuleIds.length > 0
        ) {
          hiddenReferenceKinds.push('history')
        }
        if (blockers.data.activeModuleIds.length > 0) hiddenReferenceKinds.push('module')
        if (
          blockers.data.referenceCount === 0 ||
          blockers.data.activePageIds.length > visibleReferences.length
        ) {
          hiddenReferenceKinds.push('unknown')
        }
        return {
          status: 'referenced' as const,
          references: visibleReferences,
          hasHiddenReferences: hiddenReferenceKinds.length > 0,
          hiddenReferenceKinds,
        }
      }
      throw error
    }
    noteLocalAssetMutation()
    modules.value = modules.value.filter((candidate) => candidate.id !== moduleId)
    loadedModuleVersionProjectIds.delete(publicModule.projectId)
    moduleVersionLoads.delete(publicModule.projectId)
    replaceProject(project)
    return { status: 'removed' as const }
  }

  async function loadTrash() {
    const response = await workspaceApi.getTrash(currentWorkspaceId.value)
    trashItems.value = response.items
    trashRetentionDays.value = response.retentionDays
  }

  async function restoreTrashItem(item: TrashItem) {
    await workspaceApi.restoreTrashItem(currentWorkspaceId.value, item.type, item.id)
    trashItems.value = trashItems.value.filter(
      (candidate) => candidate.type !== item.type || candidate.id !== item.id,
    )
    if (item.type === 'public-module' && item.projectId) {
      loadedModuleVersionProjectIds.delete(item.projectId)
      moduleVersionLoads.delete(item.projectId)
    }
    try {
      if (initializedForUserId) await initialize(initializedForUserId, true)
      if (item.projectId) await loadProjectAssets(item.projectId, true)
      return { synchronized: true }
    } catch {
      return { synchronized: false }
    }
  }

  async function permanentlyDeleteTrashItem(item: TrashItem) {
    await workspaceApi.permanentlyDeleteTrashItem(currentWorkspaceId.value, item.type, item.id)
    trashItems.value = trashItems.value.filter(
      (candidate) => candidate.type !== item.type || candidate.id !== item.id,
    )
    try {
      if (item.type === 'page' && item.projectId) {
        await loadProjectAssets(item.projectId, true)
      }
      return { synchronized: true }
    } catch {
      return { synchronized: false }
    }
  }

  return {
    currentWorkspaceId,
    systems,
    projects,
    pages,
    modules,
    trashItems,
    trashRetentionDays,
    selectedSystemId,
    status,
    errorMessage,
    initialize,
    reset,
    selectSystem,
    loadProjectAssets,
    loadProjectModuleVersions,
    getProject,
    getPage,
    getProjectPages,
    getProjectModules,
    getModuleReferences,
    addSystem,
    updateSystem,
    removeSystem,
    addProject,
    renameProject,
    removeProject,
    toggleProjectFavorite,
    recordProjectVisit,
    addPage,
    addModule,
    renamePage,
    renameModule,
    savePageSchema,
    saveModuleSchema,
    publishModuleSchema,
    duplicatePage,
    duplicateModule,
    removePage,
    removeModule,
    loadTrash,
    restoreTrashItem,
    permanentlyDeleteTrashItem,
  }
})
