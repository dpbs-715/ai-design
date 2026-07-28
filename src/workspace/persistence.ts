import { parsePageSchema } from '@/schema/validation.ts'
import { CACHE_TYPE, Cache } from '@vunio/utils'
import type {
  BusinessSystem,
  DesignProject,
  ProjectPageRecord,
  PublicModuleRecord,
} from './types.ts'

export const WORKSPACE_DATA_VERSION = 1

const workspaceCache = new Cache(
  CACHE_TYPE.localStorage,
  'ai-design:workspace',
  `v${WORKSPACE_DATA_VERSION}`,
)
const schemaCache = new Cache(
  CACHE_TYPE.localStorage,
  'ai-design:schemas',
  `v${WORKSPACE_DATA_VERSION}`,
)

export interface WorkspaceSnapshot {
  version: typeof WORKSPACE_DATA_VERSION
  selectedSystemId: string
  systems: BusinessSystem[]
  projects: DesignProject[]
  pages: ProjectPageRecord[]
  modules: PublicModuleRecord[]
}

type ProjectPageMetadata = Omit<ProjectPageRecord, 'schema'>
type PublicModuleMetadata = Omit<PublicModuleRecord, 'schema'>

interface PersistedWorkspaceSnapshot {
  version: typeof WORKSPACE_DATA_VERSION
  selectedSystemId: string
  systems: BusinessSystem[]
  projects: DesignProject[]
  pages: ProjectPageMetadata[]
  modules: PublicModuleMetadata[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function readSystem(value: unknown): BusinessSystem | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.icon !== 'string'
  ) {
    return undefined
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    icon: value.icon,
  }
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

function readPage(value: unknown, schemas: Record<string, unknown>): ProjectPageRecord | undefined {
  if (!isRecord(value)) return undefined
  if (
    typeof value.id !== 'string' ||
    typeof value.projectId !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.moduleReferenceCount !== 'number' ||
    typeof value.thumbnailVariant !== 'string'
  ) {
    return undefined
  }

  const schemaResult = parsePageSchema(schemas[value.id])
  if (!schemaResult.success || schemaResult.data.id !== value.id) return undefined

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

function readModule(
  value: unknown,
  schemas: Record<string, unknown>,
): PublicModuleRecord | undefined {
  if (!isRecord(value)) return undefined
  if (
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

  const schemaResult = parsePageSchema(schemas[value.id])
  if (!schemaResult.success || schemaResult.data.id !== value.id) return undefined

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
      !Array.isArray(value.systems) ||
      !Array.isArray(value.projects) ||
      !Array.isArray(value.pages) ||
      !Array.isArray(value.modules)
    ) {
      return undefined
    }

    const cachedSchemas: unknown = schemaCache.get()
    if (!isRecord(cachedSchemas) && (value.pages.length > 0 || value.modules.length > 0)) {
      return undefined
    }
    const schemas = isRecord(cachedSchemas) ? cachedSchemas : {}
    const systems = value.systems.map(readSystem)
    const projects = value.projects.map(readProject)
    const pages = value.pages.map((page) => readPage(page, schemas))
    const modules = value.modules.map((module) => readModule(module, schemas))
    if (
      systems.some((system) => !system) ||
      projects.some((project) => !project) ||
      pages.some((page) => !page) ||
      modules.some((module) => !module)
    ) {
      return undefined
    }

    return {
      version: WORKSPACE_DATA_VERSION,
      selectedSystemId: value.selectedSystemId,
      systems: systems as BusinessSystem[],
      projects: projects as DesignProject[],
      pages: pages as ProjectPageRecord[],
      modules: modules as PublicModuleRecord[],
    }
  } catch {
    return undefined
  }
}

export function saveWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  const value: PersistedWorkspaceSnapshot = {
    version: snapshot.version,
    selectedSystemId: snapshot.selectedSystemId,
    systems: snapshot.systems,
    projects: snapshot.projects,
    pages: snapshot.pages.map(({ schema: _schema, ...page }) => page),
    modules: snapshot.modules.map(({ schema: _schema, ...module }) => module),
  }

  workspaceCache.set(value)
}

export function loadWorkspaceSchema(id: string) {
  try {
    const schemas: unknown = schemaCache.get()
    if (!isRecord(schemas)) return undefined
    const result = parsePageSchema(schemas[id])
    return result.success && result.data.id === id ? result.data : undefined
  } catch {
    return undefined
  }
}

export function saveWorkspaceSchemas(schemas: ProjectPageRecord['schema'][]) {
  const cachedValue: unknown = schemaCache.get()
  const value = isRecord(cachedValue) ? { ...cachedValue } : {}
  schemas.forEach((schema) => {
    value[schema.id] = schema
  })
  schemaCache.set(value)
}

export function removeWorkspaceSchemas(ids: string[]) {
  const cachedValue: unknown = schemaCache.get()
  if (!isRecord(cachedValue)) return
  const value = { ...cachedValue }
  ids.forEach((id) => {
    delete value[id]
  })
  schemaCache.set(value)
}
