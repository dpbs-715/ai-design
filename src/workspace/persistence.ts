import { parsePageSchema } from '@/schema/validation.ts'
import { CACHE_TYPE, Cache } from '@vunio/utils'
import type { DesignProject, ProjectPageRecord, PublicModuleRecord } from './types.ts'

export const WORKSPACE_DATA_VERSION = 1

const workspaceCache = new Cache(
  CACHE_TYPE.localStorage,
  'ai-design:workspace',
  `v${WORKSPACE_DATA_VERSION}`,
)

export interface WorkspaceSnapshot {
  version: typeof WORKSPACE_DATA_VERSION
  selectedSystemId: string
  projects: DesignProject[]
  pages: ProjectPageRecord[]
  modules: PublicModuleRecord[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function readProject(value: unknown): DesignProject | undefined {
  if (!isRecord(value)) return undefined
  if (
    typeof value.id !== 'string' ||
    typeof value.systemId !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.lastEditedPageId !== 'string' ||
    typeof value.thumbnailVariant !== 'string' ||
    !isStringArray(value.pageIds) ||
    !isStringArray(value.moduleIds)
  ) {
    return undefined
  }

  return {
    id: value.id,
    systemId: value.systemId,
    name: value.name,
    description: value.description,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    lastOpenedAt: typeof value.lastOpenedAt === 'string' ? value.lastOpenedAt : undefined,
    isFavorite: value.isFavorite === true,
    pageIds: value.pageIds,
    moduleIds: value.moduleIds,
    lastEditedPageId: value.lastEditedPageId,
    thumbnailVariant: value.thumbnailVariant as DesignProject['thumbnailVariant'],
  }
}

function readPage(value: unknown): ProjectPageRecord | undefined {
  if (!isRecord(value)) return undefined
  const schemaResult = parsePageSchema(value.schema)
  if (
    !schemaResult.success ||
    typeof value.id !== 'string' ||
    typeof value.projectId !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.moduleReferenceCount !== 'number' ||
    typeof value.thumbnailVariant !== 'string'
  ) {
    return undefined
  }

  return {
    id: value.id,
    projectId: value.projectId,
    schema: schemaResult.data,
    moduleReferenceCount: value.moduleReferenceCount,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    thumbnailVariant: value.thumbnailVariant as ProjectPageRecord['thumbnailVariant'],
  }
}

function readModule(value: unknown): PublicModuleRecord | undefined {
  if (!isRecord(value)) return undefined
  const schemaResult = parsePageSchema(value.schema)
  if (
    !schemaResult.success ||
    typeof value.id !== 'string' ||
    typeof value.projectId !== 'string' ||
    typeof value.version !== 'string' ||
    typeof value.referenceCount !== 'number' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.thumbnailVariant !== 'string' ||
    !isStringArray(value.exposedParameters)
  ) {
    return undefined
  }

  return {
    id: value.id,
    projectId: value.projectId,
    schema: schemaResult.data,
    version: value.version,
    referenceCount: value.referenceCount,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    thumbnailVariant: value.thumbnailVariant as PublicModuleRecord['thumbnailVariant'],
    exposedParameters: value.exposedParameters,
  }
}

export function loadWorkspaceSnapshot(): WorkspaceSnapshot | undefined {
  try {
    const value: unknown = workspaceCache.get()
    if (
      !isRecord(value) ||
      value.version !== WORKSPACE_DATA_VERSION ||
      typeof value.selectedSystemId !== 'string' ||
      !Array.isArray(value.projects) ||
      !Array.isArray(value.pages) ||
      !Array.isArray(value.modules)
    ) {
      return undefined
    }

    const projects = value.projects.map(readProject)
    const pages = value.pages.map(readPage)
    const modules = value.modules.map(readModule)
    if (
      projects.some((project) => !project) ||
      pages.some((page) => !page) ||
      modules.some((module) => !module)
    ) {
      return undefined
    }

    return {
      version: WORKSPACE_DATA_VERSION,
      selectedSystemId: value.selectedSystemId,
      projects: projects as DesignProject[],
      pages: pages as ProjectPageRecord[],
      modules: modules as PublicModuleRecord[],
    }
  } catch {
    return undefined
  }
}

export function saveWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  workspaceCache.set(snapshot)
}
