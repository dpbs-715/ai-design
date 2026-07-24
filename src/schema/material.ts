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

export const absoluteChildrenLayoutSchema = z.strictObject({
  type: z.literal('absolute'),
  clip: z.boolean(),
})

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

export const materialSchema = z.strictObject({
  type: z.string().min(1),
  name: z.string().min(1),
  id: z.string().min(1),
  lockKey: z.string().optional(),
  placement: absolutePlacementSchema,
  childrenLayout: absoluteChildrenLayoutSchema.optional(),
  get children(): z.ZodArray<typeof materialSchema> {
    return z.array(materialSchema)
  },
  style: jsonObjectSchema.optional(),
  props: jsonObjectSchema,
  dataId: z.union([z.string(), z.number()]).optional(),
  events: materialEventsSchema.optional(),
})

export type AbsolutePlacement = z.infer<typeof absolutePlacementSchema>
export type AbsoluteChildrenLayout = z.infer<typeof absoluteChildrenLayoutSchema>
export type MaterialEvent = z.infer<typeof materialEventSchema>

// `strictNullChecks` is disabled at project level, so Zod's inferred object keys become
// optional in TypeScript. Keep the parsed domain contract explicit until strict mode is enabled.
export interface MaterialSchema {
  type: string
  name: string
  id: string
  lockKey?: string
  placement: AbsolutePlacement
  childrenLayout?: AbsoluteChildrenLayout
  children: MaterialSchema[]
  style?: Record<string, any>
  props: Record<string, any>
  dataId?: string | number
  events?: MaterialEvent[]
}

export type MaterialTemplate = Omit<MaterialSchema, 'id' | 'children'> & {
  children?: MaterialTemplate[]
}

export interface MaterialSetter {
  field: string
  label: string
  component: string
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
  setters: MaterialSetter[]

  customEventOptions?: EventOption[]
  dataBindings?: MaterialDataBinding[]

  schema: MaterialTemplate
}
