import type { Component } from 'vue'
import { z } from 'zod'

export const jsonValueSchema = z.json()
export const jsonDataSchema = jsonValueSchema.transform((value): any => value)
export const jsonObjectSchema = z
  .record(z.string(), jsonValueSchema)
  .transform((value): Record<string, any> => value)

export function extensibleObject<const Shape extends z.ZodRawShape>(shape: Shape) {
  return z.object(shape).catchall(jsonValueSchema)
}

// Validate the runtime contract while preserving JSON extension fields from agents and plugins.
const positiveDimensionSchema = z.number().finite().positive('尺寸必须大于 0')

export const absolutePlacementSchema = extensibleObject({
  type: z.literal('absolute'),
  x: z.number().finite(),
  y: z.number().finite(),
  width: positiveDimensionSchema,
  height: positiveDimensionSchema,
})

export const formItemPlacementSchema = extensibleObject({
  type: z.literal('form-item'),
  span: z.number().int('栅格跨度必须是整数').min(1).max(24),
})

export const materialPlacementSchema = z.discriminatedUnion('type', [
  absolutePlacementSchema,
  formItemPlacementSchema,
])

export const absoluteChildrenLayoutSchema = extensibleObject({
  type: z.literal('absolute'),
  clip: z.boolean(),
})

export const formGridChildrenLayoutSchema = extensibleObject({
  type: z.literal('form-grid'),
})

export const materialChildrenLayoutSchema = z.discriminatedUnion('type', [
  absoluteChildrenLayoutSchema,
  formGridChildrenLayoutSchema,
])

export const materialEventSchema = extensibleObject({
  type: z.string().min(1),
  name: z.string().min(1),
  code: z.string(),
  title: z.string().optional(),
})

export const materialEventsSchema = z.array(materialEventSchema).superRefine((events, context) => {
  const usedNames = new Set<string>()
  events.forEach((event, index) => {
    if (usedNames.has(event.name)) {
      context.addIssue({
        code: 'custom',
        path: [index, 'name'],
        message: `事件函数名 “${event.name}” 不能重复`,
      })
    }
    usedNames.add(event.name)
  })
})

export const materialDataQueryParamSchema = extensibleObject({
  id: z.string().min(1),
  name: z.string().trim().min(1, '参数名不能为空'),
  source: extensibleObject({
    type: z.literal('form-item'),
    nodeId: z.string().min(1, '请选择参数来源'),
  }),
  required: z.boolean(),
})

export const materialDataQuerySchema = extensibleObject({
  params: z.array(materialDataQueryParamSchema).superRefine((params, context) => {
    const usedNames = new Set<string>()
    params.forEach((param, index) => {
      if (usedNames.has(param.name)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'name'],
          message: `动态参数名 “${param.name}” 不能重复`,
        })
      }
      usedNames.add(param.name)
    })
  }),
  debounce: z.number().finite().nonnegative('防抖时间不能小于 0').optional(),
})

export const materialSchema: z.ZodType<MaterialSchema> = z
  .object({
    type: z.string().min(1),
    name: z.string().min(1),
    id: z.string().min(1),
    lockKey: z.string().optional(),
    placement: materialPlacementSchema,
    childrenLayout: materialChildrenLayoutSchema.optional(),
    children: z.lazy(() => z.array(materialSchema)),
    style: jsonObjectSchema.optional(),
    props: jsonObjectSchema,
    dataId: z.union([z.string(), z.number()]).optional(),
    dataQuery: materialDataQuerySchema.optional(),
    events: materialEventsSchema.optional(),
  })
  .catchall(jsonValueSchema) as unknown as z.ZodType<MaterialSchema>

export interface AbsolutePlacement {
  [key: string]: any
  type: 'absolute'
  x: number
  y: number
  width: number
  height: number
}

export interface FormItemPlacement {
  [key: string]: any
  type: 'form-item'
  span: number
}

export type MaterialPlacement = AbsolutePlacement | FormItemPlacement

export interface AbsoluteChildrenLayout {
  [key: string]: any
  type: 'absolute'
  clip: boolean
}

export interface FormGridChildrenLayout {
  [key: string]: any
  type: 'form-grid'
}

export type MaterialChildrenLayout = AbsoluteChildrenLayout | FormGridChildrenLayout

export interface MaterialEvent {
  [key: string]: any
  type: string
  name: string
  code: string
  title?: string
}

export interface MaterialDataQueryParam {
  [key: string]: any
  id: string
  name: string
  source: {
    [key: string]: any
    type: 'form-item'
    nodeId: string
  }
  required: boolean
}

export interface MaterialDataQuery {
  [key: string]: any
  params: MaterialDataQueryParam[]
  debounce?: number
}

// `strictNullChecks` is disabled at project level, so Zod's inferred object keys become
// optional in TypeScript. Keep the parsed domain contract explicit until strict mode is enabled.
interface MaterialSchemaCore {
  type: string
  name: string
  id: string
  extensions?: Record<string, any>
  lockKey?: string
  placement: MaterialPlacement
  childrenLayout?: MaterialChildrenLayout
  children: MaterialSchema[]
  style?: Record<string, any>
  props: Record<string, any>
  dataId?: string | number
  dataQuery?: MaterialDataQuery
  events?: MaterialEvent[]
}

export type MaterialSchema = MaterialSchemaCore

export type MaterialTemplate = Omit<MaterialSchemaCore, 'id' | 'children'> & {
  children?: MaterialTemplate[]
}

export interface MaterialSetter {
  field: string
  label: string
  component: string
  section?: 'config' | 'data'
  [key: string]: any
}

export interface EventOption {
  label: string
  value: string
  payloadType?: string
}

export interface MaterialPreviewDefinition {
  component: Component
  props?: Record<string, unknown>
}

export interface MaterialDataBinding {
  label: string
  field: string
}

export interface MaterialCapability {
  kind: 'leaf' | 'container'
  roles: string[]
  accepts?: string[]
}

export interface MaterialDefinition {
  //region 物料元数据
  name: string
  group: string
  icon?: string
  preview: MaterialPreviewDefinition
  //endregion

  capability?: MaterialCapability
  editorComponent?: Component
  childrenRenderer?: 'renderer' | 'material'
  validationSchema?: z.ZodType
  setters: MaterialSetter[]

  customEventOptions?: EventOption[]
  dataBindings?: MaterialDataBinding[]

  schema: MaterialTemplate
}

export function isAbsolutePlacement(placement: MaterialPlacement): placement is AbsolutePlacement {
  return placement.type === 'absolute'
}

export function isFormItemPlacement(placement: MaterialPlacement): placement is FormItemPlacement {
  return placement.type === 'form-item'
}
