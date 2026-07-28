import { defineStore } from 'pinia'
import { deepClone } from '@vunio/utils'
import { businessSystems, designProjects, projectPages, publicModules } from './mock.ts'
import type {
  DesignProject,
  ProjectPageRecord,
  PublicModuleRecord,
  ThumbnailVariant,
} from './types.ts'

const thumbnailVariants: ThumbnailVariant[] = [
  'operations',
  'park',
  'energy',
  'equipment',
  'logistics',
  'overview',
]

export const useWorkspaceStore = defineStore('workspace', () => {
  const systems = ref(deepClone(businessSystems))
  const projects = ref<DesignProject[]>(deepClone(designProjects))
  const pages = ref<ProjectPageRecord[]>(deepClone(projectPages))
  const modules = ref<PublicModuleRecord[]>(deepClone(publicModules))
  const selectedSystemId = ref(systems.value[0]?.id ?? '')

  function getProject(projectId: string) {
    return projects.value.find((project) => project.id === projectId)
  }

  function getProjectPages(projectId: string) {
    return pages.value.filter((page) => page.projectId === projectId)
  }

  function getProjectModules(projectId: string) {
    return modules.value.filter((module) => module.projectId === projectId)
  }

  function addProject(name: string) {
    const projectId = crypto.randomUUID()
    projects.value.push({
      id: projectId,
      systemId: selectedSystemId.value,
      name,
      description: '一个新的可视化设计项目',
      updatedAt: '刚刚',
      pageIds: [],
      moduleIds: [],
      lastEditedPageId: '',
      thumbnailVariant: 'overview',
    })
    return projectId
  }

  function addPage(projectId: string, name: string) {
    const pageId = crypto.randomUUID()
    const projectPage: ProjectPageRecord = {
      id: pageId,
      projectId,
      name,
      width: 1920,
      height: 1080,
      moduleReferenceCount: 0,
      updatedAt: '刚刚',
      thumbnailVariant: thumbnailVariants[pages.value.length % thumbnailVariants.length]!,
    }
    pages.value.unshift(projectPage)
    const project = getProject(projectId)
    if (project) {
      project.pageIds.unshift(pageId)
      project.lastEditedPageId = pageId
      project.updatedAt = '刚刚'
    }
    return pageId
  }

  function addModule(projectId: string, name: string) {
    const moduleId = crypto.randomUUID()
    const publicModule: PublicModuleRecord = {
      id: moduleId,
      projectId,
      name,
      version: 'v1',
      referenceCount: 0,
      updatedAt: '刚刚',
      thumbnailVariant: thumbnailVariants[modules.value.length % thumbnailVariants.length]!,
      exposedParameters: ['标题', '显示数量'],
    }
    modules.value.unshift(publicModule)
    getProject(projectId)?.moduleIds.unshift(moduleId)
    return moduleId
  }

  function renamePage(pageId: string, name: string) {
    const page = pages.value.find((candidate) => candidate.id === pageId)
    if (page) page.name = name
  }

  function renameModule(moduleId: string, name: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (publicModule) publicModule.name = name
  }

  function duplicatePage(pageId: string) {
    const sourcePage = pages.value.find((page) => page.id === pageId)
    return sourcePage ? addPage(sourcePage.projectId, `${sourcePage.name} 副本`) : undefined
  }

  function duplicateModule(moduleId: string) {
    const sourceModule = modules.value.find((module) => module.id === moduleId)
    return sourceModule ? addModule(sourceModule.projectId, `${sourceModule.name} 副本`) : undefined
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
    }
  }

  function removeModule(moduleId: string) {
    const publicModule = modules.value.find((candidate) => candidate.id === moduleId)
    if (!publicModule) return
    modules.value = modules.value.filter((candidate) => candidate.id !== moduleId)
    const project = getProject(publicModule.projectId)
    if (project) project.moduleIds = project.moduleIds.filter((id) => id !== moduleId)
  }

  return {
    systems,
    projects,
    pages,
    modules,
    selectedSystemId,
    getProject,
    getProjectPages,
    getProjectModules,
    addProject,
    addPage,
    addModule,
    renamePage,
    renameModule,
    duplicatePage,
    duplicateModule,
    removePage,
    removeModule,
  }
})
