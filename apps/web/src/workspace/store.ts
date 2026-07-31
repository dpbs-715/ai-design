import type {
  BusinessSystem,
  DesignProject,
  ProjectPageRecord,
  PublicModuleRecord,
  WorkspaceSummary,
} from '@ai-design/contracts/workspace'
import { deepClone } from '@vunio/utils'
import { defineStore } from 'pinia'

import { createPublicModuleSchema } from '@/schema/createModule.ts'
import { createPageSchema } from '@/schema/createPage.ts'
import { isSamePublicModuleContent, MODULE_DRAFT_VERSION } from '@/schema/module.ts'
import type { PublicModuleSchema } from '@/schema/module.ts'
import type { PageSchema } from '@/schema/page.ts'
import { parsePublicModuleSchema } from '@/schema/validation.ts'
import * as workspaceApi from './api.ts'
import { compareWorkspaceTimeDescending } from './time.ts'

export type WorkspaceStatus = 'idle' | 'loading' | 'ready' | 'error'

const DEFAULT_SYSTEM_ICON = 'fluent:apps-list-detail-20-regular'

interface ProjectAssetLoad {
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
  const workspaces = ref<WorkspaceSummary[]>([])
  const currentWorkspaceId = ref('')
  const systems = ref<BusinessSystem[]>([])
  const projects = ref<DesignProject[]>([])
  const pages = ref<ProjectPageRecord[]>([])
  const modules = ref<PublicModuleRecord[]>([])
  const selectedSystemId = ref('')
  const status = ref<WorkspaceStatus>('idle')
  const errorMessage = ref('')
  const loadedProjectIds = new Set<string>()
  const projectAssetLoads = new Map<string, ProjectAssetLoad>()
  let initializedForUserId = ''
  let initialization: Promise<void> | undefined
  let initializationToken: symbol | undefined

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
          workspaces.value = nextWorkspaces
          currentWorkspaceId.value = ''
          systems.value = []
          projects.value = []
          status.value = 'ready'
          return
        }

        const bootstrap = await workspaceApi.getWorkspaceBootstrap(workspace.id)
        if (initializationToken !== token || initializedForUserId !== userId) return
        workspaces.value = nextWorkspaces
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
    workspaces.value = []
    currentWorkspaceId.value = ''
    systems.value = []
    projects.value = []
    pages.value = []
    modules.value = []
    selectedSystemId.value = ''
    status.value = 'idle'
    errorMessage.value = ''
    loadedProjectIds.clear()
    projectAssetLoads.clear()
    initializedForUserId = ''
    initialization = undefined
    initializationToken = undefined
  }

  function selectSystem(systemId: string) {
    if (systems.value.some((system) => system.id === systemId)) selectedSystemId.value = systemId
  }

  async function loadProjectAssets(projectId: string, force = false) {
    if (!force && loadedProjectIds.has(projectId)) return
    const pendingLoad = projectAssetLoads.get(projectId)
    if (!force && pendingLoad) return pendingLoad.promise

    const token = Symbol()
    const request = workspaceApi.getProjectAssets(projectId).then((assets) => {
      if (projectAssetLoads.get(projectId)?.token !== token) return
      pages.value = [...pages.value.filter((page) => page.projectId !== projectId), ...assets.pages]
      modules.value = [
        ...modules.value.filter((publicModule) => publicModule.projectId !== projectId),
        ...assets.modules,
      ]
      loadedProjectIds.add(projectId)
    })
    projectAssetLoads.set(projectId, { token, promise: request })
    try {
      await request
    } finally {
      if (projectAssetLoads.get(projectId)?.token === token) projectAssetLoads.delete(projectId)
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
    if (index >= 0) projects.value[index] = project
    else projects.value.unshift(project)
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
      icon: DEFAULT_SYSTEM_ICON,
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
    const response = await workspaceApi.savePage(page.projectId, pageId, {
      schema,
      expectedRevision: page.revision,
    })
    const saved = response.page
    const index = pages.value.findIndex((candidate) => candidate.id === pageId)
    pages.value[index] = saved
    replaceProject(response.project)
    applyModuleReferenceCounts(response.moduleReferenceCounts)
    return saved.schema
  }

  async function saveModuleSchema(moduleId: string, schema: PublicModuleSchema) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule || schema.moduleId !== moduleId) return
    const result = parsePublicModuleSchema(schema)
    if (!result.success || result.data.version !== MODULE_DRAFT_VERSION) return
    if (isSamePublicModuleContent(publicModule.schema, result.data)) return publicModule.schema

    const response = await workspaceApi.saveModule(publicModule.projectId, moduleId, {
      schema: result.data,
      expectedRevision: publicModule.revision,
    })
    const saved = response.publicModule
    const index = modules.value.findIndex((candidate) => candidate.id === moduleId)
    modules.value[index] = saved
    replaceProject(response.project)
    return saved.schema
  }

  async function publishModuleSchema(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return
    const previousVersion = publicModule.version
    const response = await workspaceApi.publishModule(
      publicModule.projectId,
      moduleId,
      publicModule.revision,
    )
    const published = response.publicModule
    const index = modules.value.findIndex((candidate) => candidate.id === moduleId)
    modules.value[index] = published
    replaceProject(response.project)
    return {
      status:
        published.version === previousVersion ? ('unchanged' as const) : ('published' as const),
      version: published.version,
    }
  }

  async function duplicatePage(pageId: string) {
    const page = getPage(pageId)
    if (!page) return
    const response = await workspaceApi.duplicatePage(page.projectId, pageId)
    const duplicated = response.page
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
    modules.value.unshift(duplicated)
    replaceProject(response.project)
    return duplicated.id
  }

  async function removePage(pageId: string) {
    const page = getPage(pageId)
    if (!page) return
    const response = await workspaceApi.deletePage(page.projectId, pageId)
    pages.value = pages.value.filter((candidate) => candidate.id !== pageId)
    replaceProject(response.project)
    applyModuleReferenceCounts(response.moduleReferenceCounts)
  }

  async function removeModule(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return { status: 'not-found' as const }
    const references = getModuleReferences(moduleId)
    if (references.length) return { status: 'referenced' as const, references }

    const project = await workspaceApi.deleteModule(publicModule.projectId, moduleId)
    modules.value = modules.value.filter((candidate) => candidate.id !== moduleId)
    replaceProject(project)
    return { status: 'removed' as const }
  }

  return {
    workspaces,
    currentWorkspaceId,
    systems,
    projects,
    pages,
    modules,
    selectedSystemId,
    status,
    errorMessage,
    initialize,
    reset,
    selectSystem,
    loadProjectAssets,
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
  }
})
