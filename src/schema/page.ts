import type { MaterialSchema } from '@/schema/material.ts'
import type { RenderThemeConfig, ThemeColorValue } from '@/theme/renderTheme.ts'

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

export interface CanvasSchema {
  width: number
  height: number
  backgroundColor: ThemeColorValue
}

export interface PageSchema {
  id?: string
  theme: RenderThemeConfig
  canvas: CanvasSchema
  nodes: MaterialSchema[]
  dataSources: DataSourceSchema[]
}
