import { z } from 'zod'
import {
  absolutePlacementSchema,
  extensibleObject,
  formGridChildrenLayoutSchema,
  formItemPlacementSchema,
  jsonDataSchema,
  materialDataQuerySchema,
  materialEventsSchema,
  materialSchema,
  type MaterialEvent,
  type MaterialSchema,
} from '@/schema/material.ts'

// Form schemas validate known controls without treating the current setters as a property whitelist.
export const formRuleTriggerSchema = z.enum(['blur', 'change'])
const formRuleTriggersSchema = z.array(formRuleTriggerSchema).min(1)

export const requiredFormRuleSchema = extensibleObject({
  type: z.literal('required'),
  message: z.string().min(1),
  trigger: formRuleTriggersSchema,
})

export const minLengthFormRuleSchema = extensibleObject({
  type: z.literal('minLength'),
  value: z.number().int().nonnegative(),
  message: z.string().min(1),
  trigger: formRuleTriggersSchema,
})

export const maxLengthFormRuleSchema = extensibleObject({
  type: z.literal('maxLength'),
  value: z.number().int().nonnegative(),
  message: z.string().min(1),
  trigger: formRuleTriggersSchema,
})

export const formRuleSchema = z.discriminatedUnion('type', [
  requiredFormRuleSchema,
  minLengthFormRuleSchema,
  maxLengthFormRuleSchema,
])

export const formRulesSchema = z.array(formRuleSchema)

export const businessFormPropsSchema = extensibleObject({
  labelPosition: z.enum(['left', 'right', 'top']),
  labelWidth: z.number().finite().nonnegative(),
  size: z.enum(['small', 'default', 'large']),
  disabled: z.boolean(),
})

export const formInputControlSchema = extensibleObject({
  type: z.enum(['text', 'number']),
  placeholder: z.string(),
  clearable: z.boolean(),
  disabled: z.boolean(),
  readonly: z.boolean(),
  maxlength: z.number().int().positive(),
  showWordLimit: z.boolean(),
  min: z.number().finite(),
  max: z.number().finite(),
  step: z.number().finite().positive(),
}).superRefine((control, context) => {
  if (control.min > control.max) {
    context.addIssue({
      code: 'custom',
      path: ['max'],
      message: '最大值不能小于最小值',
    })
  }
})

export const selectOptionValueSchema = z.union([z.string(), z.number(), z.boolean()])

export interface SelectOptionSchema {
  [key: string]: any
  id: string
  label: string
  value: string | number | boolean
  disabled: boolean
  children?: SelectOptionSchema[]
}

const selectOptionSchema: z.ZodTypeAny = z.lazy(() =>
  extensibleObject({
    id: z.string().min(1),
    label: z.string(),
    value: selectOptionValueSchema,
    disabled: z.boolean(),
    children: z.array(selectOptionSchema).optional(),
  }),
)

function validateUniqueOptions(
  options: SelectOptionSchema[],
  context: z.RefinementCtx,
  path: PropertyKey[] = [],
) {
  const usedIds = new Set<string>()
  const usedValues = new Set<string>()

  options.forEach((option, index) => {
    const optionPath = [...path, index]
    if (usedIds.has(option.id)) {
      context.addIssue({
        code: 'custom',
        path: [...optionPath, 'id'],
        message: `选项 id “${option.id}” 不能重复`,
      })
    }
    usedIds.add(option.id)

    const valueKey = `${typeof option.value}:${JSON.stringify(option.value)}`
    if (usedValues.has(valueKey)) {
      context.addIssue({
        code: 'custom',
        path: [...optionPath, 'value'],
        message: `选项值 “${String(option.value)}” 不能重复`,
      })
    }
    usedValues.add(valueKey)

    if (option.children?.length) {
      validateUniqueOptions(option.children, context, [...optionPath, 'children'])
    }
  })
}

export const selectOptionsSchema = z
  .array(selectOptionSchema)
  .superRefine((options, context) =>
    validateUniqueOptions(options as SelectOptionSchema[], context),
  )

export const formCommonSelectControlSchema = extensibleObject({
  componentType: z.enum(['ElSelect', 'ElTreeSelect']),
  placeholder: z.string(),
  clearable: z.boolean(),
  filterable: z.boolean(),
  multiple: z.boolean(),
  joinSplit: z.string(),
  disabled: z.boolean(),
  checkStrictly: z.boolean(),
  options: selectOptionsSchema,
  labelField: z.string().trim().min(1),
  valueField: z.string().trim().min(1),
  disabledField: z.string(),
  childrenField: z.string().trim().min(1),
})

export const formRadioGroupControlSchema = extensibleObject({
  disabled: z.boolean(),
  type: z.enum(['radio', 'button']),
  options: selectOptionsSchema,
  labelField: z.string().trim().min(1),
  valueField: z.string().trim().min(1),
  disabledField: z.string(),
})

export const formCheckboxGroupControlSchema = extensibleObject({
  disabled: z.boolean(),
  min: z.number().int().nonnegative().optional(),
  max: z.number().int().positive().optional(),
  options: selectOptionsSchema,
  labelField: z.string().trim().min(1),
  valueField: z.string().trim().min(1),
  disabledField: z.string(),
}).superRefine((control, context) => {
  if (control.min !== undefined && control.max !== undefined && control.min > control.max) {
    context.addIssue({
      code: 'custom',
      path: ['max'],
      message: '最多选择数量不能小于最少选择数量',
    })
  }
})

export const formDatePickerControlSchema = extensibleObject({
  placeholder: z.string(),
  disabled: z.boolean(),
  clearable: z.boolean(),
  editable: z.boolean(),
  type: z.enum(['date', 'datetime', 'month', 'year']),
  valueFormat: z.string().min(1),
})

export const formColorControlSchema = extensibleObject({
  disabled: z.boolean(),
  clearable: z.boolean(),
  showAlpha: z.boolean(),
  colorFormat: z.enum(['auto', 'hex', 'rgb']),
})

const formItemBaseShape = {
  id: z.string().min(1),
  name: z.string().min(1),
  lockKey: z.string().optional(),
  dataId: z.union([z.string(), z.number()]).optional(),
  dataQuery: materialDataQuerySchema.optional(),
  placement: formItemPlacementSchema,
  children: z.tuple([]),
  events: materialEventsSchema,
}

export const formInputNodeSchema = extensibleObject({
  ...formItemBaseShape,
  type: z.literal('form-input'),
  props: extensibleObject({
    field: z.string().trim().min(1, '字段名不能为空'),
    label: z.string(),
    initialValue: jsonDataSchema,
    control: formInputControlSchema,
    rules: formRulesSchema,
  }),
})

export const formCommonSelectNodeSchema = extensibleObject({
  ...formItemBaseShape,
  type: z.literal('form-common-select'),
  props: extensibleObject({
    field: z.string().trim().min(1, '字段名不能为空'),
    label: z.string(),
    initialValue: jsonDataSchema,
    control: formCommonSelectControlSchema,
    rules: formRulesSchema,
  }),
})

export const formRadioGroupNodeSchema = extensibleObject({
  ...formItemBaseShape,
  type: z.literal('form-radio-group'),
  props: extensibleObject({
    field: z.string().trim().min(1, '字段名不能为空'),
    label: z.string(),
    initialValue: jsonDataSchema,
    control: formRadioGroupControlSchema,
    rules: formRulesSchema,
  }),
})

export const formCheckboxGroupNodeSchema = extensibleObject({
  ...formItemBaseShape,
  type: z.literal('form-checkbox-group'),
  props: extensibleObject({
    field: z.string().trim().min(1, '字段名不能为空'),
    label: z.string(),
    initialValue: jsonDataSchema,
    control: formCheckboxGroupControlSchema,
    rules: formRulesSchema,
  }),
}).superRefine((node, context) => {
  if (!Array.isArray(node.props.initialValue)) {
    context.addIssue({
      code: 'custom',
      path: ['props', 'initialValue'],
      message: '复选框组的初始值必须是数组',
    })
  }
})

export const formDatePickerNodeSchema = extensibleObject({
  ...formItemBaseShape,
  type: z.literal('form-date-picker'),
  props: extensibleObject({
    field: z.string().trim().min(1, '字段名不能为空'),
    label: z.string(),
    initialValue: z.string().nullable(),
    control: formDatePickerControlSchema,
    rules: formRulesSchema,
  }),
})

export const formColorNodeSchema = extensibleObject({
  ...formItemBaseShape,
  type: z.literal('form-color'),
  props: extensibleObject({
    field: z.string().trim().min(1, '字段名不能为空'),
    label: z.string(),
    initialValue: z.string(),
    control: formColorControlSchema,
    rules: formRulesSchema,
  }),
})

export const businessFormNodeSchema = extensibleObject({
  id: z.string().min(1),
  type: z.literal('business-form'),
  name: z.string().min(1),
  lockKey: z.string().optional(),
  placement: absolutePlacementSchema,
  childrenLayout: formGridChildrenLayoutSchema,
  props: businessFormPropsSchema,
  children: z.array(materialSchema),
  events: materialEventsSchema,
}).superRefine((form, context) => {
  const usedFields = new Set<string>()
  form.children.forEach((child, index) => {
    const field = child.props.field
    if (typeof field !== 'string') return
    const normalizedField = field.trim()
    if (usedFields.has(normalizedField)) {
      context.addIssue({
        code: 'custom',
        path: ['children', index, 'props', 'field'],
        message: `同一表单中的字段名 “${normalizedField}” 不能重复`,
      })
    }
    usedFields.add(normalizedField)
  })
})

export type FormRuleTrigger = 'blur' | 'change'

export type FormRuleSchema =
  | {
      type: 'required'
      message: string
      trigger: FormRuleTrigger[]
    }
  | {
      type: 'minLength'
      value: number
      message: string
      trigger: FormRuleTrigger[]
    }
  | {
      type: 'maxLength'
      value: number
      message: string
      trigger: FormRuleTrigger[]
    }

export interface FormItemProps {
  [key: string]: any
  field: string
  label: string
  initialValue: unknown
  control: Record<string, any>
  rules: FormRuleSchema[]
}

export interface FormItemSchema extends MaterialSchema {
  placement: {
    type: 'form-item'
    span: number
  }
  props: FormItemProps
  children: []
  events?: MaterialEvent[]
}

export interface BusinessFormProps {
  [key: string]: any
  labelPosition: 'left' | 'right' | 'top'
  labelWidth: number
  size: 'small' | 'default' | 'large'
  disabled: boolean
}

export interface BusinessFormSchema extends MaterialSchema {
  type: 'business-form'
  props: BusinessFormProps & Record<string, any>
  children: FormItemSchema[]
  childrenLayout: {
    type: 'form-grid'
  }
}

export function isFormItemSchema(node: MaterialSchema): node is FormItemSchema {
  return node.placement.type === 'form-item'
}
