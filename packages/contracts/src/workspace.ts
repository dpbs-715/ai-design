import { z } from 'zod'

import { publicModuleSchema } from './module.js'
import type { PublicModuleSchema } from './module.js'
import { pageSchema } from './page.js'
import type { PageSchema } from './page.js'

const idSchema = z.uuid()
const timestampSchema = z.iso.datetime()

export const workspaceRoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer'])

export const workspaceSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  role: workspaceRoleSchema,
})

export const businessSystemSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const designProjectSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  systemId: idSchema,
  name: z.string(),
  description: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  lastOpenedAt: timestampSchema.nullable(),
  lastEditedPageId: idSchema.nullable(),
  isFavorite: z.boolean(),
  pageCount: z.number().int().nonnegative(),
  moduleCount: z.number().int().nonnegative(),
})

const projectPageRecordShapeSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  schema: pageSchema,
  revision: z.number().int().positive(),
  publishedVersionId: idSchema.nullable(),
  moduleReferenceCount: z.number().int().nonnegative(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

const storedPublicModuleVersionShapeSchema = z.object({
  id: idSchema,
  version: z.string(),
  schema: publicModuleSchema,
  publishedAt: timestampSchema,
})

const publicModuleRecordShapeSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  schema: publicModuleSchema,
  revision: z.number().int().positive(),
  publishedVersionId: idSchema.nullable(),
  version: z.string(),
  versions: z.array(storedPublicModuleVersionShapeSchema),
  referenceCount: z.number().int().nonnegative(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const workspaceBootstrapResponseSchema = z.object({
  workspace: workspaceSummarySchema,
  systems: z.array(businessSystemSchema),
  projects: z.array(designProjectSchema),
})

export const DEFAULT_BUSINESS_SYSTEM_SEED = {
  name: '默认系统',
  description: '用于组织可视化设计项目',
  icon: 'fluent:apps-list-detail-20-regular',
} as const

export const createBusinessSystemRequestSchema = z.object({
  name: z.string().trim().min(1, '请输入系统名称').max(64, '系统名称不能超过 64 个字符'),
  description: z.string().trim().max(500, '系统描述不能超过 500 个字符'),
  icon: z.string().trim().min(1, '请选择系统图标').max(128, '系统图标标识过长'),
})

export const updateBusinessSystemRequestSchema = createBusinessSystemRequestSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, '至少需要提供一个修改字段')

export const createProjectRequestSchema = z.object({
  systemId: idSchema,
  name: z.string().trim().min(1, '请输入项目名称').max(128, '项目名称不能超过 128 个字符'),
  description: z.string().trim().max(1_000, '项目描述不能超过 1000 个字符'),
})

export const updateProjectRequestSchema = createProjectRequestSchema
  .omit({ systemId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, '至少需要提供一个修改字段')

export const updateProjectPreferenceRequestSchema = z
  .object({
    isFavorite: z.boolean().optional(),
    recordVisit: z.literal(true).optional(),
    lastEditedPageId: idSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, '至少需要提供一个偏好字段')

const pageDraftSchema = pageSchema
  .refine((schema) => idSchema.safeParse(schema.id).success, {
    path: ['id'],
    message: '页面 ID 必须是 UUID',
  })
  .refine((schema) => schema.root.name.trim().length > 0, {
    path: ['root', 'name'],
    message: '页面名称不能为空',
  })

const publicModuleDraftSchema = publicModuleSchema
  .refine((schema) => idSchema.safeParse(schema.moduleId).success, {
    path: ['moduleId'],
    message: '模块 ID 必须是 UUID',
  })
  .refine((schema) => schema.root.name.trim().length > 0, {
    path: ['root', 'name'],
    message: '模块名称不能为空',
  })

const createPageRequestShapeSchema = z.object({
  schema: pageDraftSchema,
})

const savePageRequestShapeSchema = z.object({
  schema: pageDraftSchema,
  expectedRevision: z.number().int().positive(),
})

const createPublicModuleRequestShapeSchema = z.object({
  schema: publicModuleDraftSchema,
})

const savePublicModuleRequestShapeSchema = z.object({
  schema: publicModuleDraftSchema,
  expectedRevision: z.number().int().positive(),
})

export const publishPublicModuleRequestSchema = z.object({
  expectedRevision: z.number().int().positive(),
})

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>
export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>
export type BusinessSystem = z.infer<typeof businessSystemSchema>
export type DesignProject = z.infer<typeof designProjectSchema>

export type ProjectPageRecord = Omit<z.infer<typeof projectPageRecordShapeSchema>, 'schema'> & {
  schema: PageSchema
}
export type StoredPublicModuleVersion = Omit<
  z.infer<typeof storedPublicModuleVersionShapeSchema>,
  'schema'
> & {
  schema: PublicModuleSchema
}
export type PublicModuleRecord = Omit<
  z.infer<typeof publicModuleRecordShapeSchema>,
  'schema' | 'versions'
> & {
  schema: PublicModuleSchema
  versions: StoredPublicModuleVersion[]
}

// Page and module domain types intentionally expose ergonomic extension fields while these
// schemas remain the runtime validators at the transport boundary.
function withDomainOutput<Output>(schema: z.ZodType): z.ZodType<Output> {
  return schema as z.ZodType<Output>
}

export const projectPageRecordSchema = withDomainOutput<ProjectPageRecord>(
  projectPageRecordShapeSchema,
)
export const storedPublicModuleVersionSchema = withDomainOutput<StoredPublicModuleVersion>(
  storedPublicModuleVersionShapeSchema,
)
export const publicModuleRecordSchema = withDomainOutput<PublicModuleRecord>(
  publicModuleRecordShapeSchema,
)
export const publicModuleVersionListSchema = z.object({
  moduleId: idSchema,
  revision: z.number().int().positive(),
  publishedVersionId: idSchema.nullable(),
  versions: z.array(storedPublicModuleVersionSchema),
})
export const moduleDeletionBlockersSchema = z.object({
  activePageIds: z.array(idSchema),
  trashedPageIds: z.array(idSchema),
  historicalPageIds: z.array(idSchema),
  activeModuleIds: z.array(idSchema),
  trashedModuleIds: z.array(idSchema),
  historicalModuleIds: z.array(idSchema),
  referenceCount: z.number().int().nonnegative(),
})
export const trashResourceTypeSchema = z.enum(['project', 'page', 'public-module'])
export const trashItemSchema = z.object({
  type: trashResourceTypeSchema,
  id: idSchema,
  name: z.string(),
  projectId: idSchema.nullable(),
  projectName: z.string().nullable(),
  deletedAt: timestampSchema,
  expiresAt: timestampSchema,
})
export const trashResponseSchema = z.object({
  retentionDays: z.number().int().positive(),
  items: z.array(trashItemSchema),
})
export const projectAssetsResponseSchema = z.object({
  pages: z.array(projectPageRecordSchema),
  modules: z.array(publicModuleRecordSchema),
})
export const pageMutationResponseSchema = z.object({
  project: designProjectSchema,
  page: projectPageRecordSchema,
  moduleReferenceCounts: z.array(
    z.object({
      moduleId: idSchema,
      referenceCount: z.number().int().nonnegative(),
    }),
  ),
})
export const pageDeletionResponseSchema = z.object({
  project: designProjectSchema,
  moduleReferenceCounts: pageMutationResponseSchema.shape.moduleReferenceCounts,
})
export const publicModuleMutationResponseSchema = z.object({
  project: designProjectSchema,
  publicModule: publicModuleRecordSchema,
})

export type WorkspaceBootstrapResponse = z.infer<typeof workspaceBootstrapResponseSchema>
export type ProjectAssetsResponse = z.infer<typeof projectAssetsResponseSchema>
export type PageMutationResponse = z.infer<typeof pageMutationResponseSchema>
export type PageDeletionResponse = z.infer<typeof pageDeletionResponseSchema>
export type PublicModuleMutationResponse = z.infer<typeof publicModuleMutationResponseSchema>
export type PublicModuleVersionList = z.infer<typeof publicModuleVersionListSchema>
export type ModuleDeletionBlockers = z.infer<typeof moduleDeletionBlockersSchema>
export type TrashResourceType = z.infer<typeof trashResourceTypeSchema>
export type TrashItem = z.infer<typeof trashItemSchema>
export type TrashResponse = z.infer<typeof trashResponseSchema>
export type CreateBusinessSystemRequest = z.infer<typeof createBusinessSystemRequestSchema>
export type UpdateBusinessSystemRequest = z.infer<typeof updateBusinessSystemRequestSchema>
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>
export type UpdateProjectPreferenceRequest = z.infer<typeof updateProjectPreferenceRequestSchema>
export type CreatePageRequest = Omit<z.infer<typeof createPageRequestShapeSchema>, 'schema'> & {
  schema: PageSchema
}
export type SavePageRequest = Omit<z.infer<typeof savePageRequestShapeSchema>, 'schema'> & {
  schema: PageSchema
}
export type CreatePublicModuleRequest = Omit<
  z.infer<typeof createPublicModuleRequestShapeSchema>,
  'schema'
> & {
  schema: PublicModuleSchema
}
export type SavePublicModuleRequest = Omit<
  z.infer<typeof savePublicModuleRequestShapeSchema>,
  'schema'
> & {
  schema: PublicModuleSchema
}
export const createPageRequestSchema = withDomainOutput<CreatePageRequest>(
  createPageRequestShapeSchema,
)
export const savePageRequestSchema = withDomainOutput<SavePageRequest>(savePageRequestShapeSchema)
export const createPublicModuleRequestSchema = withDomainOutput<CreatePublicModuleRequest>(
  createPublicModuleRequestShapeSchema,
)
export const savePublicModuleRequestSchema = withDomainOutput<SavePublicModuleRequest>(
  savePublicModuleRequestShapeSchema,
)
export type PublishPublicModuleRequest = z.infer<typeof publishPublicModuleRequestSchema>
