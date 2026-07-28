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
  updatedAt: string
  pageIds: string[]
  moduleIds: string[]
  lastEditedPageId: string
  thumbnailVariant: ThumbnailVariant
}

export interface ProjectPageRecord {
  id: string
  projectId: string
  name: string
  width: number
  height: number
  moduleReferenceCount: number
  updatedAt: string
  thumbnailVariant: ThumbnailVariant
}

export interface PublicModuleRecord {
  id: string
  projectId: string
  name: string
  version: string
  referenceCount: number
  updatedAt: string
  thumbnailVariant: ThumbnailVariant
  exposedParameters: string[]
}

export interface ProjectModuleInstanceProps {
  moduleId: string
  moduleVersion: string
  availableVersion: string
  title: string
  displayCount: number
  parameters: Record<string, unknown>
}
