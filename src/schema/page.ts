import type { MaterialSchema } from '@/schema/material.ts'

export interface DataSourceSchema {
  type: 'static' | 'api'
  id: string
  name: string
  data: any
  interval?: number
  params?: Record<string, any>
  url?: string
  method?: 'get' | 'post'
  responsePath?: string
}

interface CanvasSchema {
  width: number
  height: number
  backgroundColor: string
}

export interface PageSchema {
  id?: string
  canvas: CanvasSchema
  nodes: MaterialSchema[]
  dataSources: DataSourceSchema[]
}
