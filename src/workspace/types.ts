export type ThumbnailVariant =
  | 'operations'
  | 'park'
  | 'energy'
  | 'equipment'
  | 'logistics'
  | 'overview'

export interface BusinessSystem {
  id: string
  name: string
  description: string
  icon: string
}

export interface DesignProject {
  id: string
  systemId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  lastOpenedAt?: string
  isFavorite: boolean
  pageIds: string[]
  moduleIds: string[]
  lastEditedPageId: string
  thumbnailVariant: ThumbnailVariant
}

export interface ProjectPageRecord {
  id: string
  projectId: string
  schema: PageSchema
  moduleReferenceCount: number
  createdAt: string
  updatedAt: string
  thumbnailVariant: ThumbnailVariant
}

export interface PublicModuleRecord {
  id: string
  projectId: string
  schema: PublicModuleSchema
  versions: PublicModuleVersionRecord[]
  version: string
  referenceCount: number
  createdAt: string
  updatedAt: string
  thumbnailVariant: ThumbnailVariant
}
import type { PageSchema } from '@/schema/page.ts'
import type { PublicModuleSchema, PublicModuleVersionRecord } from '@/schema/module.ts'
