import type { MaterialSchema } from '@/schema/material.ts'

export interface DataSourceSchema {
  type: 'static' | 'api'
  id: string
  name: string
  data: any
  interval?: number
  params?: Record<string, any>
  url?: string
}

interface CanvasSchema {
  width: number
  height: number
  backgroundColor: string
}

export interface PageSchema {
  canvas: CanvasSchema
  nodes: MaterialSchema[]
  dataSources: DataSourceSchema[]
}
