import type { Component } from 'vue'
import { z } from 'zod'

export const jsonDataSchema = z.json().transform((value): any => value)
export const jsonObjectSchema = z
  .record(z.string(), z.json())
  .transform((value): Record<string, any> => value)

const positiveDimensionSchema = z.number().finite().positive('尺寸必须大于 0')

export const absolutePlacementSchema = z.strictObject({
  type: z.literal('absolute'),
  x: z.number().finite(),
  y: z.number().finite(),
  width: positiveDimensionSchema,
  height: positiveDimensionSchema,
})

export const formItemPlacementSchema = z.strictObject({
  type: z.literal('form-item'),
  span: z.number().int('栅格跨度必须是整数').min(1).max(24),
})

export const materialPlacementSchema = z.discriminatedUnion('type', [
  absolutePlacementSchema,
  formItemPlacementSchema,
])

export const absoluteChildrenLayoutSchema = z.strictObject({
  type: z.literal('absolute'),
  clip: z.boolean(),
})

export const formGridChildrenLayoutSchema = z.strictObject({
  type: z.literal('form-grid'),
})

export const materialChildrenLayoutSchema = z.discriminatedUnion('type', [
  absoluteChildrenLayoutSchema,
  formGridChildrenLayoutSchema,
])

export const materialEventSchema = z.strictObject({
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

export const materialDataQueryParamSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().trim().min(1, '参数名不能为空'),
  source: z.strictObject({
    type: z.literal('form-item'),
    nodeId: z.string().min(1, '请选择参数来源'),
  }),
  required: z.boolean(),
})

export const materialDataQuerySchema = z.strictObject({
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

export const materialSchema = z.strictObject({
  type: z.string().min(1),
  name: z.string().min(1),
  id: z.string().min(1),
  lockKey: z.string().optional(),
  placement: materialPlacementSchema,
  childrenLayout: materialChildrenLayoutSchema.optional(),
  get children(): z.ZodArray<typeof materialSchema> {
    return z.array(materialSchema)
  },
  style: jsonObjectSchema.optional(),
  props: jsonObjectSchema,
  dataId: z.union([z.string(), z.number()]).optional(),
  dataQuery: materialDataQuerySchema.optional(),
  events: materialEventsSchema.optional(),
})

export type AbsolutePlacement = z.infer<typeof absolutePlacementSchema>
export type FormItemPlacement = z.infer<typeof formItemPlacementSchema>
export type MaterialPlacement = AbsolutePlacement | FormItemPlacement
export type AbsoluteChildrenLayout = z.infer<typeof absoluteChildrenLayoutSchema>
export type FormGridChildrenLayout = z.infer<typeof formGridChildrenLayoutSchema>
export type MaterialChildrenLayout = AbsoluteChildrenLayout | FormGridChildrenLayout
export type MaterialEvent = z.infer<typeof materialEventSchema>
export type MaterialDataQueryParam = z.infer<typeof materialDataQueryParamSchema>
export type MaterialDataQuery = z.infer<typeof materialDataQuerySchema>

// `strictNullChecks` is disabled at project level, so Zod's inferred object keys become
// optional in TypeScript. Keep the parsed domain contract explicit until strict mode is enabled.
export interface MaterialSchema {
  type: string
  name: string
  id: string
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

export type MaterialTemplate = Omit<MaterialSchema, 'id' | 'children'> & {
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
