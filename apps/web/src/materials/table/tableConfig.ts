import type { FormItemRule } from 'element-plus'
import type { CommonTableConfig, CommonTableProps } from '@vunio/ui'
import { getByKeyOrPath } from '@vunio/utils'
import dayjs from 'dayjs'
import type {
  TableActionSchema,
  TableColumnActionSchema,
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

export type TableCellColumnSchema = TableColumnLeafSchema | TableColumnActionSchema

/** 分组表头以外的全部列 —— 数据列与操作列,即需要单元格插槽的那些。 */
export function getCellTableColumns(columns: TableColumnSchema[]): TableCellColumnSchema[] {
  return columns.flatMap((column) =>
    column.type === 'group' ? getCellTableColumns(column.children) : [column],
  )
}

/** 只取绑定数据字段的列 —— 校验、diff、格式化都只针对这些列。 */
export function getLeafTableColumns(columns: TableColumnSchema[]): TableColumnLeafSchema[] {
  return getCellTableColumns(columns).filter(
    (column): column is TableColumnLeafSchema => column.type === 'column',
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

export function isTableActionVisible(action: TableActionSchema, context: TableConditionContext) {
  return !evaluateConditionGroup(action.hiddenWhen, context, false)
}

export function isTableActionDisabled(action: TableActionSchema, context: TableConditionContext) {
  return evaluateConditionGroup(action.disabledWhen, context, false)
}

function isColumnTreeHidden(column: TableColumnSchema): boolean {
  if (column.hidden) return true
  return column.type === 'group' && column.children.every(isColumnTreeHidden)
}

/**
 * 操作列的列配置 —— 刻意不给 `component` 和 `rules`。
 *
 * CommonTable 只在没有 `component` 时才走单元格插槽,给了就会渲染成表单控件;
 * 操作列也不参与表单校验,rules 必须是空数组。
 */
function toActionConfig(column: TableColumnActionSchema): CommonTableConfig {
  const { type: _type, id: _id, actions: _actions, ...columnProps } = column

  return {
    ...columnProps,
    columnKey: column.id,
    showOverflowTooltip: false,
    rules: [],
  }
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
    if (column.type === 'action') return toActionConfig(column)

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
