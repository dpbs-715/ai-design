<script setup lang="ts">
import type { CommonTableConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { deepClone, diffRows } from '@vunio/utils'
import { injectMaterialRenderContext } from '@/context/materialRender.ts'
import { useDataSource } from '@/hooks/useDataSource.ts'
import { useMaterialRootStyle } from '@/materials/materialStyle.ts'
import { useMaterialDataQuery } from '@/runtime/dataQuery.ts'
import { injectRuntimeContext } from '@/runtime/runtimeContextProvider.ts'
import { createThemeColorReference } from '@/theme/renderTheme.ts'
import type { TableMaterialSchema, TableRow } from './schema.ts'
import {
  getLeafTableColumns,
  toCommonTableConfigs,
  toCommonTableProps,
  type TableCellContext,
} from './tableConfig.ts'
import TableCellEditor from './TableCellEditor.vue'

defineOptions({ name: 'DataTableMaterial' })

interface CommonTableExpose {
  validateForm(fields: string[]): Promise<void>
}

export interface TableChanges {
  add: TableRow[]
  update: TableRow[]
  delete: TableRow[]
}

export interface DataTableMaterialExpose {
  validate(): Promise<void>
  getValue(): TableRow[]
  getRows(): TableRow[]
  getChanges(): TableChanges
  isDirty(): boolean
  reset(): void
  acceptChanges(): void
  setRows(rows: TableRow[]): void
  addRow(row?: TableRow): void
  removeRow(rowKey: string | number): void
  moveRow(fromIndex: number, toIndex: number): void
  refresh(): Promise<void>
  configManager: ReturnType<typeof useConfigs<CommonTableConfig>>
}

const { schema } = defineProps<{
  schema: TableMaterialSchema
}>()

const emit = defineEmits<{
  change: [
    payload: {
      rowIndex: number
      rowKey: unknown
      field: string
      value: unknown
      previousValue: unknown
      row: TableRow
      rows: TableRow[]
    },
  ]
  dirtyChange: [dirty: boolean]
}>()

const tableRef = useTemplateRef<CommonTableExpose>('table')
const renderContext = injectMaterialRenderContext()
const runtimeContext = injectRuntimeContext(null)
const defaultBackgroundColor = createThemeColorReference('container-background')

const dataId = computed(() => schema.dataId)
const dataQuery = useMaterialDataQuery(() => schema, runtimeContext)
const { data, loading, error, refresh: refreshSource } = useDataSource(dataId, dataQuery)

const baselineRows = ref<TableRow[]>([])
const draftRows = ref<TableRow[]>([])
const pendingSourceRows = ref<TableRow[]>()
const effectiveMode = computed(() =>
  renderContext.mode === 'editor' ? 'readonly' : schema.props.mode,
)
const leafColumns = computed(() => getLeafTableColumns(schema.props.columns))
const diffFields = computed(() => leafColumns.value.map((column) => column.field))

const changes = computed<TableChanges>(() =>
  diffRows(baselineRows.value, draftRows.value, {
    key: schema.props.rowKey,
    fields: diffFields.value,
  }),
)
const dirty = computed(
  () =>
    changes.value.add.length > 0 ||
    changes.value.update.length > 0 ||
    changes.value.delete.length > 0,
)
const commonTableProps = computed(() => toCommonTableProps(schema.props.table))
const tableStyle = useMaterialRootStyle(() => schema.style, {
  defaults: { backgroundColor: defaultBackgroundColor },
})
const emptyText = computed(() => (error.value ? '数据加载失败' : '暂无数据'))

function normalizeRows(payload: unknown): TableRow[] {
  if (!Array.isArray(payload)) return []
  return payload.filter(
    (row): row is TableRow => row !== null && typeof row === 'object' && !Array.isArray(row),
  )
}

function replaceRows(rows: TableRow[]) {
  baselineRows.value = deepClone(rows)
  draftRows.value = deepClone(rows)
  pendingSourceRows.value = undefined
}

watch(dataId, () => {
  baselineRows.value = []
  draftRows.value = []
  pendingSourceRows.value = undefined
})

watch(
  data,
  (payload) => {
    const rows = normalizeRows(payload)
    if (dirty.value) {
      pendingSourceRows.value = deepClone(rows)
      return
    }
    replaceRows(rows)
  },
  { immediate: true },
)

watch(dirty, (value) => emit('dirtyChange', value))

function findBaselineRow(row: TableRow) {
  const key = schema.props.rowKey
  return baselineRows.value.find((candidate) => candidate[key] === row[key])
}

function notifyCellChange(value: unknown, context: TableCellContext) {
  const field = String(context.column.field ?? '')
  emit('change', {
    rowIndex: context.rowIndex,
    rowKey: context.rowData[schema.props.rowKey],
    field,
    value,
    previousValue: findBaselineRow(context.rowData)?.[field],
    row: deepClone(context.rowData),
    rows: getRows(),
  })
}

function updateCellValue(value: unknown, context: TableCellContext) {
  const field = String(context.column.field ?? '')
  context.rowData[field] = value
}

const schemaConfigs = computed<CommonTableConfig[]>(() =>
  toCommonTableConfigs(schema.props.columns, {
    mode: effectiveMode.value,
  }),
)
const configManager = useConfigs<CommonTableConfig>(schemaConfigs, false)

function getRows() {
  return deepClone(draftRows.value)
}

function getChanges() {
  return deepClone(changes.value)
}

function isDirty() {
  return dirty.value
}

async function validate() {
  const fields = draftRows.value.flatMap((_, rowIndex) =>
    leafColumns.value
      .filter((column) => column.editor?.enabled && column.editor.rules.length)
      .map((column) => `${rowIndex}.${column.field}`),
  )
  if (fields.length) await tableRef.value?.validateForm(fields)
}

function reset() {
  replaceRows(pendingSourceRows.value ?? baselineRows.value)
}

function acceptChanges() {
  baselineRows.value = deepClone(draftRows.value)
  pendingSourceRows.value = undefined
}

watch(dirty, (value) => {
  if (value || !pendingSourceRows.value) return
  replaceRows(pendingSourceRows.value)
})

function setRows(rows: TableRow[]) {
  draftRows.value = deepClone(rows)
}

function addRow(row: TableRow = {}) {
  draftRows.value.push(deepClone(row))
}

function removeRow(rowKey: string | number) {
  const key = schema.props.rowKey
  draftRows.value = draftRows.value.filter((row) => row[key] !== rowKey)
}

function moveRow(fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    fromIndex >= draftRows.value.length ||
    toIndex < 0 ||
    toIndex >= draftRows.value.length ||
    fromIndex === toIndex
  ) {
    return
  }
  const [row] = draftRows.value.splice(fromIndex, 1)
  if (row) draftRows.value.splice(toIndex, 0, row)
}

async function refresh() {
  await refreshSource()
}

watchEffect((onCleanup) => {
  if (!runtimeContext) return
  const unregister = runtimeContext.registerNodeValue(schema.id, getRows)
  onCleanup(unregister)
})

defineExpose<DataTableMaterialExpose>({
  validate,
  getValue: getRows,
  getRows,
  getChanges,
  isDirty,
  reset,
  acceptChanges,
  setRows,
  addRow,
  removeRow,
  moveRow,
  refresh,
  configManager,
})
</script>

<template>
  <div
    class="data-table-material"
    :class="{ 'is-borderless': !schema.props.table.border }"
    :style="tableStyle"
  >
    <CommonTable
      ref="table"
      v-bind="commonTableProps"
      :config="configManager.config"
      :data="draftRows"
      :loading="loading"
      :empty-text="emptyText"
      :row-key="schema.props.rowKey"
      :use-index="schema.props.table.useIndex"
      :use-selection="schema.props.table.useSelection"
      :stripe="schema.props.table.stripe"
      :border="schema.props.table.border"
      :size="schema.props.table.size"
      :show-header="schema.props.table.showHeader"
      :show-overflow-tooltip="false"
      height="100%"
    >
      <template v-for="column in leafColumns" :key="column.id" #[column.field]="context">
        <TableCellEditor
          :column="column"
          :context="context"
          :editable="effectiveMode === 'editable' && Boolean(column.editor?.enabled)"
          :show-overflow-tooltip="schema.props.table.showOverflowTooltip"
          @update="updateCellValue"
          @change="notifyCellChange"
        />
      </template>
    </CommonTable>
  </div>
</template>

<style scoped>
.data-table-material {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.data-table-material :deep(.el-form) {
  height: 100%;
}

.data-table-material :deep(.commonTable) {
  background: transparent;
}

/*
 * Element Plus enables its border class for grouped headers even when border is false.
 * Keep the regular horizontal row separators while removing border-mode outer and
 * vertical lines requested by the material setting.
 */
.data-table-material.is-borderless :deep(.el-table--border::before),
.data-table-material.is-borderless :deep(.el-table--border::after),
.data-table-material.is-borderless :deep(.el-table--border .el-table__inner-wrapper::after) {
  display: none;
}

.data-table-material.is-borderless :deep(.el-table--border .el-table__cell) {
  border-right: 0;
}
</style>
