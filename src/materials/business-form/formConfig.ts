import type { FormItemRule } from 'element-plus'
import type { CommonFormConfig } from '@vunio/ui'
import { getByKeyOrPath } from '@vunio/utils'
import type { FormItemSchema, FormRuleSchema } from './schema.ts'

const formControlComponents: Record<string, string> = {
  'form-input': 'input',
  'form-common-select': 'commonSelect',
  'form-radio-group': 'radioGroup',
  'form-checkbox-group': 'checkboxGroup',
  'form-date-picker': 'datePicker',
  'form-color': 'color',
}

export function getFormControlComponent(type: string) {
  const component = formControlComponents[type]
  if (!component) throw new Error(`Unsupported form control material: ${type}`)
  return component
}

export function toElementFormRules(rules: FormRuleSchema[]): FormItemRule[] {
  return rules.map((rule) => {
    if (rule.type === 'required') {
      return {
        required: true,
        message: rule.message,
        trigger: rule.trigger,
      }
    }

    return {
      [rule.type === 'minLength' ? 'min' : 'max']: rule.value,
      message: rule.message,
      trigger: rule.trigger,
    }
  })
}

export function toCommonFormConfig(node: FormItemSchema): CommonFormConfig {
  const component = getFormControlComponent(node.type)
  const {
    options,
    labelField: _labelField,
    valueField: _valueField,
    disabledField: _disabledField,
    childrenField: _childrenField,
    ...controlProps
  } = node.props.control
  let props: Record<string, any> = controlProps

  if (component === 'input') {
    const { maxlength, showWordLimit, min, max, step, type, ...commonInputProps } = controlProps
    props =
      type === 'number'
        ? { ...commonInputProps, type, min, max, step }
        : { ...commonInputProps, type, maxlength, showWordLimit }
  } else if (component === 'commonSelect') {
    props = {
      ...node.props.control,
      options,
    }
  } else if (['radioGroup', 'checkboxGroup'].includes(component)) {
    props = {
      ...controlProps,
      options,
    }
  }
  const rules =
    component === 'input' && node.props.control.type === 'number'
      ? node.props.rules.filter((rule) => rule.type === 'required')
      : node.props.rules

  return {
    field: node.props.field,
    label: node.props.label,
    span: node.placement.span,
    component,
    props,
    rules: toElementFormRules(rules),
  }
}

type OptionValue = string | number | boolean

interface NormalizedOption {
  id: string
  label: string
  value: OptionValue
  disabled: boolean
}

function isOptionValue(value: unknown): value is OptionValue {
  return ['string', 'number', 'boolean'].includes(typeof value)
}

function toRows(payload: unknown) {
  if (Array.isArray(payload)) return payload
  return payload == null ? [] : [payload]
}

function getMappedValue(row: unknown, field: string) {
  if (row !== null && typeof row === 'object') return getByKeyOrPath(row, field)
  return row
}

function normalizeOption(
  row: unknown,
  index: number,
  control: FormItemSchema['props']['control'],
): NormalizedOption | undefined {
  const value = getMappedValue(row, control.valueField)
  if (!isOptionValue(value)) return

  const mappedLabel = getMappedValue(row, control.labelField)
  const mappedDisabled = control.disabledField ? getMappedValue(row, control.disabledField) : false
  return {
    id:
      row !== null && typeof row === 'object' && 'id' in row
        ? String(row.id)
        : `${index}-${String(value)}`,
    label: mappedLabel == null ? String(value) : String(mappedLabel),
    value,
    disabled: Boolean(mappedDisabled),
  }
}

function normalizeOptions(payload: unknown, control: FormItemSchema['props']['control']) {
  return toRows(payload)
    .map((row, index) => normalizeOption(row, index, control))
    .filter((option): option is NormalizedOption => Boolean(option))
}

export function resolveFormControlConfig(
  node: FormItemSchema,
  config: CommonFormConfig,
  sourceData: unknown,
): CommonFormConfig {
  if (node.dataId == null || sourceData === undefined) return config

  return {
    ...config,
    props: {
      ...config.props,
      options:
        config.component === 'commonSelect'
          ? toRows(sourceData)
          : normalizeOptions(sourceData, node.props.control),
    },
  }
}
