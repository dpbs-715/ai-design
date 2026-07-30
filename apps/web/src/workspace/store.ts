import { defineStore } from 'pinia'
import { deepClone } from '@vunio/utils'
import { createPageSchema } from '@/schema/createPage.ts'
import { createPublicModuleSchema } from '@/schema/createModule.ts'
import {
  getNextPublicModuleVersion,
  isSamePublicModuleContent,
  MODULE_DRAFT_VERSION,
  type PublicModuleSchema,
} from '@/schema/module.ts'
import { mapMaterialTree } from '@/schema/nodeTree.ts'
import type { PageSchema } from '@/schema/page.ts'
import { parsePublicModuleSchema } from '@/schema/validation.ts'
import { createDefaultWorkspaceData } from './defaults.ts'
import { businessSystems } from './systems.ts'
import { loadWorkspaceSnapshot, persistWorkspace, WORKSPACE_DATA_VERSION } from './persistence.ts'
import type { WorkspacePersistenceChange } from './persistence.ts'
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

function getReferencedModuleIds(schema: PageSchema) {
  const moduleIds = new Set<string>()
  const visit = (node: PageSchema['root']['children'][number]) => {
    if (node.type === 'project-module-instance') {
      const moduleId = node.props.moduleId
      if (typeof moduleId === 'string') moduleIds.add(moduleId)
    }
    node.children.forEach(visit)
  }
  schema.root.children.forEach(visit)
  return moduleIds
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

  function persist(change: WorkspacePersistenceChange = {}) {
    persistWorkspace(
      {
        version: WORKSPACE_DATA_VERSION,
        selectedSystemId: selectedSystemId.value,
        systems: systems.value,
        projects: projects.value,
        pages: pages.value,
        modules: modules.value,
      },
      change,
    )
  }

  if (!restored) {
    persist({
      upsertSchemas: pages.value.map((page) => page.schema),
      upsertModules: modules.value,
    })
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
      const pageModuleIds = getReferencedModuleIds(page.schema)
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
    persist({ removeSchemaIds: schemaIds })
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

  function getModuleReferences(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return []
    return getProjectPages(publicModule.projectId).filter((page) =>
      getReferencedModuleIds(page.schema).has(moduleId),
    )
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
    const sourceModules = getProjectModules(projectId)
    const moduleIdMap = new Map(
      sourceModules.map((sourceModule) => [sourceModule.id, crypto.randomUUID()]),
    )
    const remapModuleReferences = (schema: PublicModuleSchema) => {
      schema.root.children = mapMaterialTree(schema.root.children, (node) => {
        if (node.type !== 'project-module-instance') return node
        const copiedModuleId = moduleIdMap.get(String(node.props.moduleId ?? ''))
        return copiedModuleId
          ? { ...node, props: { ...node.props, moduleId: copiedModuleId } }
          : node
      })
      return schema
    }
    const copiedModules = sourceModules.map((sourceModule) => {
      const id = moduleIdMap.get(sourceModule.id)!
      const schema = deepClone(sourceModule.schema)
      schema.moduleId = id
      const versions = deepClone(sourceModule.versions).map((version) => ({
        ...version,
        schema: remapModuleReferences({
          ...version.schema,
          moduleId: id,
        }),
      }))
      return {
        ...deepClone(sourceModule),
        id,
        projectId: newProjectId,
        schema: remapModuleReferences(schema),
        versions,
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
    persist({
      upsertSchemas: copiedPages.map((page) => page.schema),
      upsertModules: copiedModules,
    })
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
    persist({ removeSchemaIds: schemaIds })
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
    persist({ upsertSchemas: [projectPage.schema] })
    return pageId
  }

  function addModule(projectId: string, name: string) {
    const project = getProject(projectId)
    if (!project) return undefined
    const moduleId = crypto.randomUUID()
    const timestamp = now()
    const schema = createPublicModuleSchema({ id: moduleId, name })
    const publicModule: PublicModuleRecord = {
      id: moduleId,
      projectId,
      schema,
      versions: [],
      version: MODULE_DRAFT_VERSION,
      referenceCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      thumbnailVariant: nextThumbnail(modules.value.length),
    }
    modules.value.unshift(publicModule)
    project.moduleIds.unshift(moduleId)
    project.updatedAt = timestamp
    persist({ upsertModules: [publicModule] })
    return moduleId
  }

  function renamePage(pageId: string, name: string) {
    const page = pages.value.find((candidate) => candidate.id === pageId)
    if (!page) return
    page.schema.root.name = name
    page.updatedAt = now()
    touchProject(page.projectId, page.updatedAt)
    persist({ upsertSchemas: [page.schema] })
  }

  function renameModule(moduleId: string, name: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return
    publicModule.schema.root.name = name
    publicModule.updatedAt = now()
    touchProject(publicModule.projectId, publicModule.updatedAt)
    persist({ upsertModules: [publicModule] })
  }

  function savePageSchema(pageId: string, schema: PageSchema) {
    const page = pages.value.find((candidate) => candidate.id === pageId)
    if (!page || schema.id !== pageId) return
    page.schema = deepClone(schema)
    page.updatedAt = now()
    recomputeProjectReferences(page.projectId)
    touchProject(page.projectId, page.updatedAt)
    persist({ upsertSchemas: [page.schema] })
  }

  function saveModuleSchema(moduleId: string, schema: PublicModuleSchema) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule || schema.moduleId !== moduleId) return
    const result = parsePublicModuleSchema(schema)
    if (result.success === false || result.data.version !== MODULE_DRAFT_VERSION) return
    if (isSamePublicModuleContent(publicModule.schema, result.data)) return publicModule.schema

    publicModule.schema = deepClone(result.data)
    publicModule.updatedAt = now()
    touchProject(publicModule.projectId, publicModule.updatedAt)
    persist({ upsertModules: [publicModule] })
    return publicModule.schema
  }

  function publishModuleSchema(moduleId: string, schema: PublicModuleSchema) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule || schema.moduleId !== moduleId) return undefined

    const result = parsePublicModuleSchema(schema)
    if (result.success === false || result.data.version !== MODULE_DRAFT_VERSION) return undefined
    const draft = deepClone(result.data)
    const latestPublishedVersion =
      publicModule.versions.find((version) => version.version === publicModule.version) ??
      publicModule.versions.at(-1)
    if (latestPublishedVersion && isSamePublicModuleContent(draft, latestPublishedVersion.schema)) {
      return {
        status: 'unchanged' as const,
        version: latestPublishedVersion.version,
      }
    }

    const nextVersion = getNextPublicModuleVersion(publicModule.versions)
    const timestamp = now()
    const publishedSchema: PublicModuleSchema = {
      ...deepClone(draft),
      version: nextVersion,
    }

    publicModule.schema = draft
    publicModule.version = nextVersion
    publicModule.versions.push({
      version: nextVersion,
      schema: publishedSchema,
      publishedAt: timestamp,
    })
    publicModule.updatedAt = timestamp
    touchProject(publicModule.projectId, timestamp)
    persist({ upsertModules: [publicModule] })
    return {
      status: 'published' as const,
      version: nextVersion,
    }
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
    persist({ upsertSchemas: [schema] })
    return id
  }

  function duplicateModule(moduleId: string) {
    const source = modules.value.find((module) => module.id === moduleId)
    const project = source && getProject(source.projectId)
    if (!source || !project) return undefined
    const id = crypto.randomUUID()
    const timestamp = now()
    const schema = deepClone(source.schema)
    schema.moduleId = id
    schema.root.name = `${schema.root.name} 副本`
    const initialVersion = source.versions.find((version) => version.version === source.version)
    const publishedSchema: PublicModuleSchema | undefined = initialVersion
      ? {
          ...deepClone(initialVersion.schema),
          moduleId: id,
          version: 'v1',
          root: {
            ...deepClone(initialVersion.schema.root),
            name: schema.root.name,
          },
        }
      : undefined
    const duplicatedModule: PublicModuleRecord = {
      ...deepClone(source),
      id,
      schema,
      versions: publishedSchema
        ? [
            {
              version: 'v1',
              schema: publishedSchema,
              publishedAt: timestamp,
            },
          ]
        : [],
      referenceCount: 0,
      version: publishedSchema ? 'v1' : MODULE_DRAFT_VERSION,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    modules.value.unshift({
      ...duplicatedModule,
    })
    project.moduleIds.unshift(id)
    project.updatedAt = timestamp
    persist({ upsertModules: [duplicatedModule] })
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
    persist({ removeSchemaIds: [pageId] })
  }

  function removeModule(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return { status: 'not-found' as const }
    const references = getModuleReferences(moduleId)
    if (references.length) {
      return {
        status: 'referenced' as const,
        references,
      }
    }

    modules.value = modules.value.filter((candidate) => candidate.id !== moduleId)
    const project = getProject(publicModule.projectId)
    if (project) {
      project.moduleIds = project.moduleIds.filter((id) => id !== moduleId)
      project.updatedAt = now()
    }
    persist({ removeSchemaIds: [moduleId] })
    return { status: 'removed' as const }
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
    getModuleReferences,
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
    publishModuleSchema,
    duplicatePage,
    duplicateModule,
    removePage,
    removeModule,
  }
})
