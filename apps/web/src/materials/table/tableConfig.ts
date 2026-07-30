import type { FormItemRule } from 'element-plus'
import type { CommonTableConfig, CommonTableProps } from '@vunio/ui'
import { getByKeyOrPath } from '@vunio/utils'
import dayjs from 'dayjs'
import type {
  TableColumnLeafSchema,
  TableColumnSchema,
  TableCondition,
  TableConditionGroup,
  TableEditorComponent,
  TableMode,
  TableProps,
  TableRow,
} from './schema.ts'

export interface TableConditionContext {
  cellData: unknown
  rowData: TableRow
  rowIndex: number
  tableData: TableRow[]
}

export interface TableCellContext extends TableConditionContext {
  column: CommonTableConfig
}

interface TableConfigOptions {
  mode: TableMode
}

export function toCommonTableProps(tableProps: TableProps['table']): CommonTableProps {
  const {
    config: _config,
    data: _data,
    emptyText: _emptyText,
    height: _height,
    loading: _loading,
    rowKey: _rowKey,
    showOverflowTooltip: _showOverflowTooltip,
    ...commonTableProps
  } = tableProps

  return commonTableProps
}

interface TableRuleContext {
  rowData: TableRow
  tableData: TableRow[]
  $index: number
}

const editorComponentMap: Record<TableEditorComponent, string> = {
  input: 'input',
  number: 'number',
  select: 'commonSelect',
  date: 'datePicker',
}

export function getTableEditorComponent(component: TableEditorComponent) {
  return editorComponentMap[component]
}

export function getLeafTableColumns(columns: TableColumnSchema[]): TableColumnLeafSchema[] {
  return columns.flatMap((column) =>
    column.type === 'group' ? getLeafTableColumns(column.children) : [column],
  )
}

function getConditionValue(condition: TableCondition, context: TableConditionContext) {
  if (condition.field === '$rowIndex') return context.rowIndex
  if (condition.field === '$cell') return context.cellData
  return getByKeyOrPath(context.rowData, condition.field)
}

function evaluateCondition(condition: TableCondition, context: TableConditionContext) {
  const actual = getConditionValue(condition, context)

  switch (condition.operator) {
    case 'equals':
      return actual === condition.value
    case 'notEquals':
      return actual !== condition.value
    case 'greaterThan':
      return Number(actual) > Number(condition.value)
    case 'lessThan':
      return Number(actual) < Number(condition.value)
    case 'contains':
      return Array.isArray(actual)
        ? actual.includes(condition.value)
        : String(actual ?? '').includes(String(condition.value ?? ''))
    case 'truthy':
      return Boolean(actual)
    case 'falsy':
      return !actual
  }
}

export function evaluateConditionGroup(
  group: TableConditionGroup | undefined,
  context: TableConditionContext,
  emptyResult: boolean,
) {
  if (!group?.conditions.length) return emptyResult
  return group.logic === 'and'
    ? group.conditions.every((condition) => evaluateCondition(condition, context))
    : group.conditions.some((condition) => evaluateCondition(condition, context))
}

function toElementRules(column: TableColumnLeafSchema): FormItemRule[] {
  return (column.editor?.rules ?? []).map((rule) => ({
    required: true,
    message: rule.message,
    trigger: rule.trigger,
  }))
}

export function formatTableCellValue(row: TableRow, column: TableColumnLeafSchema) {
  const value = row[column.field]
  if (value == null || value === '') return '—'

  if (column.display.type === 'number') {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return String(value)
    const precision = Number(column.display.props?.precision ?? 2)
    return new Intl.NumberFormat('zh-CN', {
      maximumFractionDigits: precision,
    }).format(numericValue)
  }

  if (column.display.type === 'date') {
    const format = String(column.display.props?.format ?? 'YYYY-MM-DD')
    const parsed = dayjs(value)
    return parsed.isValid() ? parsed.format(format) : String(value)
  }

  if (column.display.type === 'tag') {
    const option = column.editor?.props.options?.find((candidate) => candidate.value === value)
    return option?.label ?? String(value)
  }

  return String(value)
}

function isColumnTreeHidden(column: TableColumnSchema): boolean {
  if (column.hidden) return true
  return column.type === 'group' && column.children.every(isColumnTreeHidden)
}

function toLeafConfig(
  column: TableColumnLeafSchema,
  options: TableConfigOptions,
): CommonTableConfig {
  const editor = column.editor
  const { type: _type, id: _id, display: _display, editor: _editor, ...columnProps } = column

  return {
    ...columnProps,
    columnKey: column.id,
    showOverflowTooltip: false,
    component:
      options.mode === 'editable' && editor?.enabled
        ? getTableEditorComponent(editor.component)
        : undefined,
    rules:
      options.mode === 'editable' && editor?.enabled
        ? (ruleContext?: TableRuleContext) => {
            if (!ruleContext) return toElementRules(column)

            const { rowData, tableData, $index } = ruleContext
            const context: TableConditionContext = {
              cellData: rowData[column.field],
              rowData,
              rowIndex: $index,
              tableData,
            }
            const editable = evaluateConditionGroup(editor.editableWhen, context, true)
            const disabled = evaluateConditionGroup(editor.disabledWhen, context, false)
            return editable && !disabled ? toElementRules(column) : []
          }
        : [],
  }
}

export function toCommonTableConfigs(
  columns: TableColumnSchema[],
  options: TableConfigOptions,
): CommonTableConfig[] {
  return columns.map((column) => {
    if (column.type === 'column') return toLeafConfig(column, options)

    const { type: _type, id: _id, children: _children, ...columnProps } = column

    return {
      ...columnProps,
      field: column.id,
      columnKey: column.id,
      hidden: isColumnTreeHidden(column),
      columnChildren: toCommonTableConfigs(column.children, options),
    }
  })
}
