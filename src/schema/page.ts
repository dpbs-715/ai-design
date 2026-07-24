import { jsonDataSchema, jsonObjectSchema, materialSchema } from '@/schema/material.ts'
import type { MaterialSchema } from '@/schema/material.ts'
import type { RenderThemeConfig, ThemeColorValue } from '@/theme/renderTheme.ts'
import { z } from 'zod'

const dataSourceBaseShape = {
  id: z.string().min(1),
  name: z.string().min(1),
  data: jsonDataSchema,
}

export const staticDataSourceSchema = z.strictObject({
  ...dataSourceBaseShape,
  type: z.literal('static'),
})

export const apiDataSourceSchema = z.strictObject({
  ...dataSourceBaseShape,
  type: z.literal('api'),
  url: z.string().trim().min(1, '请输入请求地址'),
  method: z.enum(['get', 'post']),
  interval: z.number().finite().nonnegative('轮询周期不能小于 0').optional(),
  params: jsonObjectSchema.optional(),
  responsePath: z.string().optional(),
})

export const dataSourceSchema = z.discriminatedUnion('type', [
  staticDataSourceSchema,
  apiDataSourceSchema,
])

const positiveDimensionSchema = z.number().finite().positive('尺寸必须大于 0')

export const canvasPlacementSchema = z.strictObject({
  type: z.literal('canvas'),
  width: positiveDimensionSchema,
  height: positiveDimensionSchema,
})

export const canvasBackgroundImageSchema = z.strictObject({
  src: z.string(),
  fit: z.enum(['cover', 'contain', 'fill', 'auto']),
  position: z.string(),
  repeat: z.enum(['no-repeat', 'repeat', 'repeat-x', 'repeat-y']),
  opacity: z.number().min(0).max(1),
})

export const themeColorSchema = z.union([
  z.string(),
  z.strictObject({
    type: z.literal('theme'),
    key: z.string(),
  }),
])

export const canvasBackgroundSchema = z.strictObject({
  color: themeColorSchema,
  image: canvasBackgroundImageSchema,
})

export const themeVariableSchema = z.strictObject({
  key: z.string().min(1),
  name: z.string().min(1),
  type: z.literal('color'),
  light: z.string(),
  dark: z.string(),
  builtin: z.boolean().optional(),
})

export const renderThemeSchema = z.strictObject({
  mode: z.enum(['system', 'light', 'dark']),
  variables: z.array(themeVariableSchema).superRefine((variables, context) => {
    const usedKeys = new Set<string>()
    variables.forEach((variable, index) => {
      if (usedKeys.has(variable.key)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'key'],
          message: `主题变量 key “${variable.key}” 不能重复`,
        })
      }
      usedKeys.add(variable.key)
    })
  }),
})

export const pageRootSchema = z.strictObject({
  id: z.string().min(1),
  type: z.literal('page-root'),
  name: z.string().min(1),
  placement: canvasPlacementSchema,
  style: z.strictObject({
    background: canvasBackgroundSchema,
  }),
  props: z.strictObject({}),
  events: z.tuple([]),
  children: z.array(materialSchema),
})

export const dataSourcesSchema = z.array(dataSourceSchema).superRefine((sources, context) => {
  const usedIds = new Set<string>()
  sources.forEach((source, index) => {
    if (usedIds.has(source.id)) {
      context.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: `数据源 id “${source.id}” 不能重复`,
      })
    }
    usedIds.add(source.id)
  })
})

export const pageSchema = z.strictObject({
  schemaVersion: z.literal(2),
  id: z.string().optional(),
  theme: renderThemeSchema,
  root: pageRootSchema,
  dataSources: dataSourcesSchema,
})

interface DataSourceBaseSchema {
  id: string
  name: string
  data: any
}

export interface StaticDataSourceSchema extends DataSourceBaseSchema {
  type: 'static'
}

export interface ApiDataSourceSchema extends DataSourceBaseSchema {
  type: 'api'
  url: string
  method: 'get' | 'post'
  interval?: number
  params?: Record<string, any>
  responsePath?: string
}

export type DataSourceSchema = StaticDataSourceSchema | ApiDataSourceSchema

export interface CanvasPlacement {
  type: 'canvas'
  width: number
  height: number
}

export interface CanvasBackgroundImage {
  src: string
  fit: 'cover' | 'contain' | 'fill' | 'auto'
  position: string
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  opacity: number
}

export interface CanvasBackground {
  color: ThemeColorValue
  image: CanvasBackgroundImage
}

export interface PageRootSchema {
  id: string
  type: 'page-root'
  name: string
  placement: CanvasPlacement
  style: {
    background: CanvasBackground
  }
  props: Record<string, never>
  events: []
  children: MaterialSchema[]
}

export interface PageSchema {
  schemaVersion: 2
  id?: string
  theme: RenderThemeConfig
  root: PageRootSchema
  dataSources: DataSourceSchema[]
}
