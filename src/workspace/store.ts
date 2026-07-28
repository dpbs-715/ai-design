import { defineStore } from 'pinia'
import { deepClone } from '@vunio/utils'
import { createPageSchema } from '@/schema/createPage.ts'
import { mapMaterialTree } from '@/schema/nodeTree.ts'
import type { PageSchema } from '@/schema/page.ts'
import { createDefaultWorkspaceData } from './defaults.ts'
import { businessSystems } from './systems.ts'
import {
  loadWorkspaceSnapshot,
  removeWorkspaceSchemas,
  saveWorkspaceSnapshot,
  saveWorkspaceSchemas,
  WORKSPACE_DATA_VERSION,
} from './persistence.ts'
import type {
  BusinessSystem,
  DesignProject,
  ProjectPageRecord,
  PublicModuleRecord,
  ThumbnailVariant,
} from './types.ts'
import { compareWorkspaceTimeDescending } from './time.ts'

const thumbnailVariants: ThumbnailVariant[] = [
  'operations',
  'park',
  'energy',
  'equipment',
  'logistics',
  'overview',
]

function now() {
  return new Date().toISOString()
}

function nextThumbnail(index: number) {
  return thumbnailVariants[index % thumbnailVariants.length]!
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const restored = loadWorkspaceSnapshot()
  const initialWorkspace = restored ?? createDefaultWorkspaceData()
  const systems = ref<BusinessSystem[]>(initialWorkspace.systems)
  const projects = ref<DesignProject[]>(initialWorkspace.projects)
  const pages = ref<ProjectPageRecord[]>(initialWorkspace.pages)
  const modules = ref<PublicModuleRecord[]>(initialWorkspace.modules)
  const selectedSystemId = ref(
    systems.value.some((system) => system.id === initialWorkspace.selectedSystemId)
      ? initialWorkspace.selectedSystemId
      : (systems.value[0]?.id ?? ''),
  )

  function persist() {
    saveWorkspaceSnapshot({
      version: WORKSPACE_DATA_VERSION,
      selectedSystemId: selectedSystemId.value,
      systems: systems.value,
      projects: projects.value,
      pages: pages.value,
      modules: modules.value,
    })
  }

  if (!restored) {
    saveWorkspaceSchemas(pages.value.map((page) => page.schema))
    persist()
  }

  function touchProject(projectId: string, timestamp = now()) {
    const project = getProject(projectId)
    if (project) project.updatedAt = timestamp
  }

  function recomputeProjectReferences(projectId: string) {
    const projectModules = getProjectModules(projectId)
    const referencedPageIds = new Map<string, Set<string>>()
    projectModules.forEach((publicModule) => {
      referencedPageIds.set(publicModule.id, new Set())
    })

    getProjectPages(projectId).forEach((page) => {
      const pageModuleIds = new Set<string>()
      const visit = (node: PageSchema['root']['children'][number]) => {
        if (node.type === 'project-module-instance') {
          const moduleId = node.props.moduleId
          if (typeof moduleId === 'string') pageModuleIds.add(moduleId)
        }
        node.children.forEach(visit)
      }
      page.schema.root.children.forEach(visit)
      page.moduleReferenceCount = pageModuleIds.size
      pageModuleIds.forEach((moduleId) => referencedPageIds.get(moduleId)?.add(page.id))
    })

    projectModules.forEach((publicModule) => {
      publicModule.referenceCount = referencedPageIds.get(publicModule.id)?.size ?? 0
    })
  }

  function selectSystem(systemId: string) {
    if (!systems.value.some((system) => system.id === systemId)) return
    selectedSystemId.value = systemId
    persist()
  }

  function addSystem(name: string, description: string) {
    if (systems.value.some((system) => system.name === name)) return undefined
    const systemId = crypto.randomUUID()
    const fallbackIcon = 'fluent:apps-list-detail-20-regular'
    const icon =
      businessSystems[systems.value.length % businessSystems.length]?.icon ?? fallbackIcon
    systems.value.unshift({ id: systemId, name, description, icon })
    selectedSystemId.value = systemId
    persist()
    return systemId
  }

  function updateSystem(
    systemId: string,
    systemDetails: Pick<BusinessSystem, 'name' | 'description'>,
  ) {
    const system = systems.value.find((candidate) => candidate.id === systemId)
    if (
      !system ||
      systems.value.some(
        (candidate) => candidate.id !== systemId && candidate.name === systemDetails.name,
      )
    ) {
      return false
    }
    system.name = systemDetails.name
    system.description = systemDetails.description
    persist()
    return true
  }

  function removeSystem(systemId: string) {
    if (systems.value.length <= 1) return false
    const systemIndex = systems.value.findIndex((system) => system.id === systemId)
    if (systemIndex < 0) return false

    const projectIds = new Set(
      projects.value
        .filter((project) => project.systemId === systemId)
        .map((project) => project.id),
    )
    const schemaIds = [
      ...pages.value.filter((page) => projectIds.has(page.projectId)).map((page) => page.id),
      ...modules.value
        .filter((publicModule) => projectIds.has(publicModule.projectId))
        .map((publicModule) => publicModule.id),
    ]
    const nextSystem = systems.value[systemIndex + 1] ?? systems.value[systemIndex - 1]

    systems.value = systems.value.filter((system) => system.id !== systemId)
    projects.value = projects.value.filter((project) => !projectIds.has(project.id))
    pages.value = pages.value.filter((page) => !projectIds.has(page.projectId))
    modules.value = modules.value.filter((publicModule) => !projectIds.has(publicModule.projectId))
    if (selectedSystemId.value === systemId) selectedSystemId.value = nextSystem?.id ?? ''
    persist()
    removeWorkspaceSchemas(schemaIds)
    return true
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
      .filter((module) => module.projectId === projectId)
      .sort((left, right) => compareWorkspaceTimeDescending(left.updatedAt, right.updatedAt))
  }

  function addProject(name: string) {
    const projectId = crypto.randomUUID()
    const timestamp = now()
    projects.value.push({
      id: projectId,
      systemId: selectedSystemId.value,
      name,
      description: '一个新的可视化设计项目',
      createdAt: timestamp,
      updatedAt: timestamp,
      isFavorite: false,
      pageIds: [],
      moduleIds: [],
      lastEditedPageId: '',
      thumbnailVariant: nextThumbnail(projects.value.length),
    })
    persist()
    return projectId
  }

  function renameProject(projectId: string, name: string) {
    const project = getProject(projectId)
    if (!project) return
    project.name = name
    touchProject(projectId)
    persist()
  }

  function duplicateProject(projectId: string) {
    const source = getProject(projectId)
    if (!source) return undefined

    const timestamp = now()
    const newProjectId = crypto.randomUUID()
    const moduleIdMap = new Map<string, string>()
    const copiedModules = getProjectModules(projectId).map((sourceModule) => {
      const id = crypto.randomUUID()
      moduleIdMap.set(sourceModule.id, id)
      const schema = deepClone(sourceModule.schema)
      schema.id = id
      return {
        ...deepClone(sourceModule),
        id,
        projectId: newProjectId,
        schema,
        createdAt: timestamp,
        updatedAt: timestamp,
        referenceCount: 0,
      }
    })

    const copiedPages = getProjectPages(projectId).map((sourcePage) => {
      const id = crypto.randomUUID()
      const schema = deepClone(sourcePage.schema)
      schema.id = id
      schema.root.children = mapMaterialTree(schema.root.children, (node) => {
        if (node.type !== 'project-module-instance') return node
        const moduleId = String(node.props.moduleId ?? '')
        const copiedModuleId = moduleIdMap.get(moduleId)
        return copiedModuleId
          ? { ...node, props: { ...node.props, moduleId: copiedModuleId } }
          : node
      })
      return {
        ...deepClone(sourcePage),
        id,
        projectId: newProjectId,
        schema,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    })

    modules.value.unshift(...copiedModules)
    pages.value.unshift(...copiedPages)
    projects.value.push({
      ...deepClone(source),
      id: newProjectId,
      name: `${source.name} 副本`,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastOpenedAt: undefined,
      isFavorite: false,
      pageIds: copiedPages.map((page) => page.id),
      moduleIds: copiedModules.map((module) => module.id),
      lastEditedPageId: copiedPages[0]?.id ?? '',
    })
    recomputeProjectReferences(newProjectId)
    saveWorkspaceSchemas([
      ...copiedPages.map((page) => page.schema),
      ...copiedModules.map((module) => module.schema),
    ])
    persist()
    return newProjectId
  }

  function removeProject(projectId: string) {
    if (!getProject(projectId)) return
    const schemaIds = [
      ...getProjectPages(projectId).map((page) => page.id),
      ...getProjectModules(projectId).map((module) => module.id),
    ]
    projects.value = projects.value.filter((project) => project.id !== projectId)
    pages.value = pages.value.filter((page) => page.projectId !== projectId)
    modules.value = modules.value.filter((module) => module.projectId !== projectId)
    persist()
    removeWorkspaceSchemas(schemaIds)
  }

  function toggleProjectFavorite(projectId: string) {
    const project = getProject(projectId)
    if (!project) return
    project.isFavorite = !project.isFavorite
    persist()
  }

  function recordProjectVisit(projectId: string, pageId?: string) {
    const project = getProject(projectId)
    if (!project) return
    const timestamp = now()
    project.lastOpenedAt = timestamp
    if (pageId && project.pageIds.includes(pageId)) project.lastEditedPageId = pageId
    persist()
  }

  function addPage(projectId: string, name: string) {
    const project = getProject(projectId)
    if (!project) return undefined
    const pageId = crypto.randomUUID()
    const timestamp = now()
    const projectPage: ProjectPageRecord = {
      id: pageId,
      projectId,
      schema: createPageSchema({ id: pageId, name }),
      moduleReferenceCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      thumbnailVariant: nextThumbnail(pages.value.length),
    }
    pages.value.unshift(projectPage)
    project.pageIds.unshift(pageId)
    project.lastEditedPageId = pageId
    project.updatedAt = timestamp
    project.lastOpenedAt = timestamp
    saveWorkspaceSchemas([projectPage.schema])
    persist()
    return pageId
  }

  function addModule(projectId: string, name: string) {
    const project = getProject(projectId)
    if (!project) return undefined
    const moduleId = crypto.randomUUID()
    const timestamp = now()
    const publicModule: PublicModuleRecord = {
      id: moduleId,
      projectId,
      schema: createPageSchema({ id: moduleId, name, width: 1200, height: 360 }),
      version: 'v1',
      referenceCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      thumbnailVariant: nextThumbnail(modules.value.length),
      exposedParameters: ['标题', '显示数量'],
    }
    modules.value.unshift(publicModule)
    project.moduleIds.unshift(moduleId)
    project.updatedAt = timestamp
    saveWorkspaceSchemas([publicModule.schema])
    persist()
    return moduleId
  }

  function renamePage(pageId: string, name: string) {
    const page = pages.value.find((candidate) => candidate.id === pageId)
    if (!page) return
    page.schema.root.name = name
    page.updatedAt = now()
    touchProject(page.projectId, page.updatedAt)
    saveWorkspaceSchemas([page.schema])
    persist()
  }

  function renameModule(moduleId: string, name: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return
    publicModule.schema.root.name = name
    publicModule.updatedAt = now()
    touchProject(publicModule.projectId, publicModule.updatedAt)
    saveWorkspaceSchemas([publicModule.schema])
    persist()
  }

  function savePageSchema(pageId: string, schema: PageSchema) {
    const page = pages.value.find((candidate) => candidate.id === pageId)
    if (!page || schema.id !== pageId) return
    page.schema = deepClone(schema)
    page.updatedAt = now()
    recomputeProjectReferences(page.projectId)
    touchProject(page.projectId, page.updatedAt)
    saveWorkspaceSchemas([page.schema])
    persist()
  }

  function saveModuleSchema(moduleId: string, schema: PageSchema) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule || schema.id !== moduleId) return
    publicModule.schema = deepClone(schema)
    publicModule.updatedAt = now()
    touchProject(publicModule.projectId, publicModule.updatedAt)
    saveWorkspaceSchemas([publicModule.schema])
    persist()
  }

  function duplicatePage(pageId: string) {
    const source = pages.value.find((page) => page.id === pageId)
    const project = source && getProject(source.projectId)
    if (!source || !project) return undefined
    const id = crypto.randomUUID()
    const timestamp = now()
    const schema = deepClone(source.schema)
    schema.id = id
    schema.root.name = `${schema.root.name} 副本`
    pages.value.unshift({
      ...deepClone(source),
      id,
      schema,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    project.pageIds.unshift(id)
    project.updatedAt = timestamp
    recomputeProjectReferences(project.id)
    saveWorkspaceSchemas([schema])
    persist()
    return id
  }

  function duplicateModule(moduleId: string) {
    const source = modules.value.find((module) => module.id === moduleId)
    const project = source && getProject(source.projectId)
    if (!source || !project) return undefined
    const id = crypto.randomUUID()
    const timestamp = now()
    const schema = deepClone(source.schema)
    schema.id = id
    schema.root.name = `${schema.root.name} 副本`
    modules.value.unshift({
      ...deepClone(source),
      id,
      schema,
      referenceCount: 0,
      version: 'v1',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    project.moduleIds.unshift(id)
    project.updatedAt = timestamp
    saveWorkspaceSchemas([schema])
    persist()
    return id
  }

  function removePage(pageId: string) {
    const page = pages.value.find((candidate) => candidate.id === pageId)
    if (!page) return
    pages.value = pages.value.filter((candidate) => candidate.id !== pageId)
    const project = getProject(page.projectId)
    if (project) {
      project.pageIds = project.pageIds.filter((id) => id !== pageId)
      if (project.lastEditedPageId === pageId) {
        project.lastEditedPageId = project.pageIds[0] ?? ''
      }
      project.updatedAt = now()
      recomputeProjectReferences(project.id)
    }
    persist()
    removeWorkspaceSchemas([pageId])
  }

  function removeModule(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return
    modules.value = modules.value.filter((candidate) => candidate.id !== moduleId)
    const project = getProject(publicModule.projectId)
    if (project) {
      project.moduleIds = project.moduleIds.filter((id) => id !== moduleId)
      project.updatedAt = now()
    }
    persist()
    removeWorkspaceSchemas([moduleId])
  }

  return {
    systems,
    projects,
    pages,
    modules,
    selectedSystemId,
    selectSystem,
    addSystem,
    updateSystem,
    removeSystem,
    getProject,
    getPage,
    getProjectPages,
    getProjectModules,
    addProject,
    renameProject,
    duplicateProject,
    removeProject,
    toggleProjectFavorite,
    recordProjectVisit,
    addPage,
    addModule,
    renamePage,
    renameModule,
    savePageSchema,
    saveModuleSchema,
    duplicatePage,
    duplicateModule,
    removePage,
    removeModule,
  }
})
