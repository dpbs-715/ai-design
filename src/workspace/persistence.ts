import { parsePageSchema, parsePublicModuleSchema } from '@/schema/validation.ts'
import { CACHE_TYPE, Cache, deepClone } from '@vunio/utils'
import type { PageSchema } from '@/schema/page.ts'
import { createPublicModuleSchema } from '@/schema/createModule.ts'
import {
  MODULE_DRAFT_VERSION,
  normalizeProjectModuleInstanceProps,
  type PublicModuleVersionRecord,
} from '@/schema/module.ts'
import { mapMaterialTree } from '@/schema/nodeTree.ts'
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

export interface WorkspacePersistenceChange {
  upsertSchemas?: PageSchema[]
  upsertModules?: PublicModuleRecord[]
  removeSchemaIds?: string[]
}

type ProjectPageMetadata = Omit<ProjectPageRecord, 'schema'>
type PublicModuleMetadata = Omit<PublicModuleRecord, 'schema' | 'versions'>

interface PersistedPublicModuleBundle {
  kind: 'public-module-bundle'
  draft: PublicModuleRecord['schema']
  versions: PublicModuleVersionRecord[]
}

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

function normalizeModuleInstanceNodes<
  T extends { root: { children: PageSchema['root']['children'] } },
>(schema: T) {
  schema.root.children = mapMaterialTree(schema.root.children, (node) =>
    node.type === 'project-module-instance'
      ? {
          ...node,
          props: {
            ...node.props,
            ...normalizeProjectModuleInstanceProps(node.props),
          },
        }
      : node,
  )
  return schema
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
  normalizeModuleInstanceNodes(schemaResult.data)

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
    typeof value.thumbnailVariant !== 'string'
  ) {
    return undefined
  }

  const cachedModule = schemas[value.id]
  let schema: PublicModuleRecord['schema']
  let versions: PublicModuleVersionRecord[]

  if (isRecord(cachedModule) && cachedModule.kind === 'public-module-bundle') {
    const draftResult = parsePublicModuleSchema(cachedModule.draft)
    if (
      !draftResult.success ||
      draftResult.data.moduleId !== value.id ||
      draftResult.data.version !== MODULE_DRAFT_VERSION
    ) {
      return undefined
    }
    if (!Array.isArray(cachedModule.versions)) return undefined

    const parsedVersions = cachedModule.versions.map((candidate) => {
      if (
        !isRecord(candidate) ||
        typeof candidate.version !== 'string' ||
        typeof candidate.publishedAt !== 'string'
      ) {
        return undefined
      }
      const versionResult = parsePublicModuleSchema(candidate.schema)
      if (
        !versionResult.success ||
        versionResult.data.moduleId !== value.id ||
        versionResult.data.version !== candidate.version
      ) {
        return undefined
      }
      return {
        version: candidate.version,
        schema: versionResult.data,
        publishedAt: candidate.publishedAt,
      }
    })
    if (parsedVersions.some((version) => !version)) return undefined

    schema = normalizeModuleInstanceNodes(draftResult.data)
    versions = parsedVersions as PublicModuleVersionRecord[]
    versions.forEach((version) => normalizeModuleInstanceNodes(version.schema))
  } else {
    const legacyResult = parsePageSchema(cachedModule)
    if (!legacyResult.success || legacyResult.data.id !== value.id) return undefined
    const migratedSchema = createPublicModuleSchema({
      id: value.id,
      name: legacyResult.data.root.name,
      width: legacyResult.data.root.placement.width,
      height: legacyResult.data.root.placement.height,
    })
    migratedSchema.theme = legacyResult.data.theme
    migratedSchema.root = {
      ...legacyResult.data.root,
      type: 'module-root',
    }
    migratedSchema.dataSources = legacyResult.data.dataSources
    schema = normalizeModuleInstanceNodes(migratedSchema)
    versions = [
      {
        version: value.version,
        schema: {
          ...deepClone(migratedSchema),
          version: value.version,
        },
        publishedAt: value.updatedAt,
      },
    ]
  }
  if (
    value.version === MODULE_DRAFT_VERSION
      ? versions.length > 0
      : !versions.some((candidate) => candidate.version === value.version)
  ) {
    return undefined
  }

  return {
    id: value.id,
    projectId: value.projectId,
    schema,
    versions,
    version: value.version,
    referenceCount: value.referenceCount,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    thumbnailVariant: value.thumbnailVariant as PublicModuleRecord['thumbnailVariant'],
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

function saveWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  const value: PersistedWorkspaceSnapshot = {
    version: snapshot.version,
    selectedSystemId: snapshot.selectedSystemId,
    systems: snapshot.systems,
    projects: snapshot.projects,
    pages: snapshot.pages.map(({ schema: _schema, ...page }) => page),
    modules: snapshot.modules.map(
      ({ schema: _schema, versions: _versions, ...publicModule }) => publicModule,
    ),
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

function saveWorkspaceSchemas(schemas: PageSchema[], modules: PublicModuleRecord[]) {
  const cachedValue: unknown = schemaCache.get()
  const value = isRecord(cachedValue) ? { ...cachedValue } : {}
  schemas.forEach((schema) => {
    value[schema.id] = schema
  })
  modules.forEach((publicModule) => {
    const bundle: PersistedPublicModuleBundle = {
      kind: 'public-module-bundle',
      draft: publicModule.schema,
      versions: publicModule.versions,
    }
    value[publicModule.id] = bundle
  })
  schemaCache.set(value)
}

function removeWorkspaceSchemas(ids: string[]) {
  const cachedValue: unknown = schemaCache.get()
  if (!isRecord(cachedValue)) return
  const value = { ...cachedValue }
  ids.forEach((id) => {
    delete value[id]
  })
  schemaCache.set(value)
}

export function persistWorkspace(
  snapshot: WorkspaceSnapshot,
  { upsertSchemas = [], upsertModules = [], removeSchemaIds = [] }: WorkspacePersistenceChange = {},
) {
  if (upsertSchemas.length || upsertModules.length) {
    saveWorkspaceSchemas(upsertSchemas, upsertModules)
  }
  saveWorkspaceSnapshot(snapshot)
  if (removeSchemaIds.length) removeWorkspaceSchemas(removeSchemaIds)
}
