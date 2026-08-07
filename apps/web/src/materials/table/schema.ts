import { z } from 'zod'
import {
  absolutePlacementSchema,
  extensibleObject,
  jsonDataSchema,
  jsonValueSchema,
  materialDataQuerySchema,
  materialEventsSchema,
  type MaterialSchema,
} from '@/schema/material.ts'

export const tableModeSchema = z.enum(['readonly', 'editable'])
export const tableColumnAlignSchema = z.enum(['left', 'center', 'right'])
export const tableDisplayTypeSchema = z.enum(['text', 'number', 'date', 'tag'])
export const tableEditorComponentSchema = z.enum(['input', 'number', 'select', 'date'])
export const tableConditionOperatorSchema = z.enum([
  'equals',
  'notEquals',
  'greaterThan',
  'lessThan',
  'contains',
  'truthy',
  'falsy',
])

export const tableConditionSchema = extensibleObject({
  field: z.string().trim().min(1, '条件字段不能为空'),
  operator: tableConditionOperatorSchema,
  value: jsonValueSchema.optional(),
})

export const tableConditionGroupSchema = extensibleObject({
  logic: z.enum(['and', 'or']),
  conditions: z.array(tableConditionSchema),
})

export const tableRuleSchema = extensibleObject({
  type: z.literal('required'),
  message: z.string().min(1, '校验提示不能为空'),
  trigger: z.array(z.enum(['blur', 'change'])).min(1),
})

export const tableEditorOptionSchema = extensibleObject({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  disabled: z.boolean().optional(),
})

export const tableActionVariantSchema = z.enum([
  'normal',
  'primary',
  'success',
  'warning',
  'danger',
  'info',
  'link',
])

export const tableColumnEditorSchema = extensibleObject({
  enabled: z.boolean().default(false),
  component: tableEditorComponentSchema.default('input'),
  props: extensibleObject({
    placeholder: z.string().optional(),
    options: z.array(tableEditorOptionSchema).optional(),
    clearable: z.boolean().optional(),
    valueFormat: z.string().optional(),
  }).default({}),
  rules: z.array(tableRuleSchema).default([]),
  editableWhen: tableConditionGroupSchema.optional(),
  disabledWhen: tableConditionGroupSchema.optional(),
})

const optionalColumnDimensionSchema = z.preprocess(
  (value) =>
    value === '' ||
    value === null ||
    value === undefined ||
    (typeof value === 'number' && Number.isNaN(value))
      ? undefined
      : value,
  z.number().finite().positive('列宽必须大于 0').optional(),
)

export const tableColumnLeafSchema = extensibleObject({
  type: z.literal('column'),
  id: z.string().min(1),
  field: z.string().trim().min(1, '字段名不能为空'),
  label: z.string().default(''),
  hidden: z.boolean().default(false),
  width: optionalColumnDimensionSchema,
  minWidth: optionalColumnDimensionSchema,
  fixed: z.union([z.boolean(), z.enum(['left', 'right'])]).optional(),
  align: tableColumnAlignSchema.default('left'),
  headerAlign: tableColumnAlignSchema.default('center'),
  display: extensibleObject({
    type: tableDisplayTypeSchema.default('text'),
    props: jsonDataSchema.default({}),
  }).default({ type: 'text', props: {} }),
  editor: tableColumnEditorSchema.optional(),
})

export const tableActionSchema = extensibleObject({
  id: z.string().trim().min(1, '操作标识不能为空'),
  label: z.string().trim().min(1, '操作名称不能为空'),
  variant: tableActionVariantSchema.default('link'),
  icon: z.string().default(''),
  /** 满足条件时隐藏该操作;不配置则始终显示。 */
  hiddenWhen: tableConditionGroupSchema.optional(),
  /** 满足条件时禁用该操作;不配置则始终可点。 */
  disabledWhen: tableConditionGroupSchema.optional(),
})

/**
 * 操作列 —— 不绑定数据字段,只渲染按钮。
 *
 * `field` 仍然必填:CommonTable 的单元格插槽是按 `configItem.field` 取的
 * (@vunio/ui renderColumns),没有 field 就拿不到插槽,单元格会退化成空白。
 * 这里默认 `$actions`,与真实数据字段不会冲突。
 */
export const tableColumnActionSchema = extensibleObject({
  type: z.literal('action'),
  id: z.string().min(1),
  field: z.string().trim().min(1).default('$actions'),
  label: z.string().default('操作'),
  hidden: z.boolean().default(false),
  width: optionalColumnDimensionSchema,
  minWidth: optionalColumnDimensionSchema,
  fixed: z.union([z.boolean(), z.enum(['left', 'right'])]).optional(),
  align: tableColumnAlignSchema.default('center'),
  headerAlign: tableColumnAlignSchema.default('center'),
  actions: z.array(tableActionSchema).default([]),
})

export const tableColumnSchema: z.ZodTypeAny = z.lazy(() =>
  z.preprocess(
    (value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value

      const column = value as Record<string, unknown>
      const children = column.children ?? column.columnChildren
      const inferredType = Array.isArray(children)
        ? 'group'
        : Array.isArray(column.actions)
          ? 'action'
          : 'column'
      const type = column.type ?? inferredType

      return {
        ...column,
        type,
        id: column.id ?? column.columnKey ?? column.field,
        ...(type === 'group' ? { children: children ?? [] } : {}),
      }
    },
    z.discriminatedUnion('type', [
      extensibleObject({
        type: z.literal('group'),
        id: z.string().min(1),
        label: z.string().default(''),
        hidden: z.boolean().default(false),
        headerAlign: tableColumnAlignSchema.default('center'),
        children: z.array(tableColumnSchema).default([]),
      }),
      tableColumnLeafSchema,
      tableColumnActionSchema,
    ]),
  ),
)

export const tableColumnsSchema = z.array(tableColumnSchema).superRefine((columns, context) => {
  const usedIds = new Set<string>()
  const usedFields = new Set<string>()

  function visit(items: TableColumnSchema[], path: PropertyKey[]) {
    items.forEach((column, index) => {
      const columnPath = [...path, index]
      if (usedIds.has(column.id)) {
        context.addIssue({
          code: 'custom',
          path: [...columnPath, 'id'],
          message: `列 id “${column.id}” 不能重复`,
        })
      }
      usedIds.add(column.id)

      if (column.type === 'group') {
        visit(column.children, [...columnPath, 'children'])
        return
      }

      if (usedFields.has(column.field)) {
        context.addIssue({
          code: 'custom',
          path: [...columnPath, 'field'],
          message: `字段名 “${column.field}” 不能重复`,
        })
      }
      usedFields.add(column.field)

      if (column.type !== 'action') return

      const usedActionIds = new Set<string>()
      column.actions.forEach((action, actionIndex) => {
        if (usedActionIds.has(action.id)) {
          context.addIssue({
            code: 'custom',
            path: [...columnPath, 'actions', actionIndex, 'id'],
            message: `操作标识 “${action.id}” 不能重复`,
          })
        }
        usedActionIds.add(action.id)
      })
    })
  }

  visit(columns as TableColumnSchema[], [])
})

export const tablePropsSchema = extensibleObject({
  mode: tableModeSchema,
  rowKey: z.string().trim().min(1, '行唯一字段不能为空'),
  columns: tableColumnsSchema,
  table: extensibleObject({
    useIndex: z.boolean(),
    useSelection: z.boolean(),
    stripe: z.boolean(),
    border: z.boolean(),
    size: z.enum(['small', 'default', 'large']),
    showHeader: z.boolean(),
    showOverflowTooltip: z.boolean(),
  }),
})

export const tableNodeSchema = extensibleObject({
  id: z.string().min(1),
  type: z.literal('data-table'),
  name: z.string().min(1),
  lockKey: z.string().optional(),
  placement: absolutePlacementSchema,
  style: extensibleObject({
    backgroundColor: jsonDataSchema,
  }),
  props: tablePropsSchema,
  dataId: z.union([z.string(), z.number()]).optional(),
  dataQuery: materialDataQuerySchema.optional(),
  children: z.tuple([]),
  events: materialEventsSchema,
})

export type TableMode = z.infer<typeof tableModeSchema>
export type TableColumnAlign = z.infer<typeof tableColumnAlignSchema>
export type TableDisplayType = z.infer<typeof tableDisplayTypeSchema>
export type TableEditorComponent = z.infer<typeof tableEditorComponentSchema>
export type TableActionVariant = z.infer<typeof tableActionVariantSchema>
export type TableConditionOperator = z.infer<typeof tableConditionOperatorSchema>

export interface TableCondition {
  [key: string]: any
  field: string
  operator: TableConditionOperator
  value?: unknown
}

export interface TableConditionGroup {
  [key: string]: any
  logic: 'and' | 'or'
  conditions: TableCondition[]
}

export interface TableRuleSchema {
  [key: string]: any
  type: 'required'
  message: string
  trigger: Array<'blur' | 'change'>
}

export interface TableEditorOption {
  [key: string]: any
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface TableColumnEditorSchema {
  [key: string]: any
  enabled: boolean
  component: TableEditorComponent
  props: {
    [key: string]: any
    placeholder?: string
    options?: TableEditorOption[]
    clearable?: boolean
    valueFormat?: string
  }
  rules: TableRuleSchema[]
  editableWhen?: TableConditionGroup
  disabledWhen?: TableConditionGroup
}

export interface TableColumnLeafSchema {
  [key: string]: any
  type: 'column'
  id: string
  field: string
  label: string
  hidden: boolean
  width?: number
  minWidth?: number
  fixed?: boolean | 'left' | 'right'
  align: TableColumnAlign
  headerAlign: TableColumnAlign
  display: {
    [key: string]: any
    type: TableDisplayType
    props: Record<string, any>
  }
  editor?: TableColumnEditorSchema
}

export interface TableColumnGroupSchema {
  [key: string]: any
  type: 'group'
  id: string
  label: string
  hidden: boolean
  headerAlign: TableColumnAlign
  children: TableColumnSchema[]
}

export interface TableActionSchema {
  [key: string]: any
  id: string
  label: string
  variant: TableActionVariant
  icon: string
  hiddenWhen?: TableConditionGroup
  disabledWhen?: TableConditionGroup
}

export interface TableColumnActionSchema {
  [key: string]: any
  type: 'action'
  id: string
  field: string
  label: string
  hidden: boolean
  width?: number
  minWidth?: number
  fixed?: boolean | 'left' | 'right'
  align: TableColumnAlign
  headerAlign: TableColumnAlign
  actions: TableActionSchema[]
}

export type TableColumnSchema =
  | TableColumnGroupSchema
  | TableColumnLeafSchema
  | TableColumnActionSchema

export interface TableProps {
  [key: string]: any
  mode: TableMode
  rowKey: string
  columns: TableColumnSchema[]
  table: {
    [key: string]: any
    useIndex: boolean
    useSelection: boolean
    stripe: boolean
    border: boolean
    size: 'small' | 'default' | 'large'
    showHeader: boolean
    showOverflowTooltip: boolean
  }
}

export interface TableMaterialSchema extends MaterialSchema {
  type: 'data-table'
  props: TableProps
  children: []
}

export type TableRow = Record<string, any>
