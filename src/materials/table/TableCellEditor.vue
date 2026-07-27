<script setup lang="ts">
import { CreateComponent } from '@vunio/ui'
import { ElTooltip } from 'element-plus'
import type { TableColumnLeafSchema } from './schema.ts'
import {
  evaluateConditionGroup,
  formatTableCellValue,
  getTableEditorComponent,
  type TableCellContext,
} from './tableConfig.ts'

defineOptions({ name: 'DataTableCellEditor' })

const props = defineProps<{
  column: TableColumnLeafSchema
  context: TableCellContext
  editable: boolean
  showOverflowTooltip: boolean
}>()

const emit = defineEmits<{
  update: [value: unknown, context: TableCellContext]
  change: [value: unknown, context: TableCellContext]
}>()

const currentContext = computed<TableCellContext>(() => ({
  ...props.context,
  cellData: props.context.rowData[props.column.field],
}))
const cellEditable = computed(
  () =>
    props.editable &&
    evaluateConditionGroup(props.column.editor?.editableWhen, currentContext.value, true),
)
const disabled = computed(() =>
  evaluateConditionGroup(props.column.editor?.disabledWhen, currentContext.value, false),
)
const displayValue = computed(() => formatTableCellValue(props.context.rowData, props.column))
const displayRef = useTemplateRef<HTMLSpanElement>('display')
const displayOverflowing = ref(false)
const controlConfig = computed(() => {
  const editor = props.column.editor
  const component = editor ? getTableEditorComponent(editor.component) : 'input'
  const editorProps = editor?.props ?? {}

  return {
    field: props.column.field,
    component,
    props: {
      ...editorProps,
      disabled: disabled.value || editorProps.disabled,
      ...(editor?.component === 'select'
        ? {
            options: editorProps.options ?? [],
            labelField: 'label',
            valueField: 'value',
            disabledField: 'disabled',
          }
        : {}),
      onChange: (value: unknown) => {
        emit('change', value, {
          ...currentContext.value,
          cellData: value,
        })
      },
    },
  }
})

function updateValue(value: unknown) {
  emit('update', value, {
    ...currentContext.value,
    cellData: value,
  })
}

function updateDisplayOverflow() {
  const element = displayRef.value
  displayOverflowing.value =
    props.showOverflowTooltip &&
    Boolean(
      element &&
      (element.scrollWidth > element.clientWidth + 1 ||
        element.scrollHeight > element.clientHeight + 1),
    )
}

watch([displayValue, () => props.showOverflowTooltip], () => nextTick(updateDisplayOverflow))

onMounted(() => {
  updateDisplayOverflow()
})
</script>

<template>
  <ElTooltip
    v-if="!cellEditable"
    :content="displayValue"
    :disabled="!showOverflowTooltip || !displayOverflowing"
  >
    <span
      ref="display"
      class="data-table-cell-editor__display"
      @pointerenter="updateDisplayOverflow"
    >
      {{ displayValue }}
    </span>
  </ElTooltip>
  <CreateComponent
    v-else
    class="data-table-cell-editor"
    :config="controlConfig"
    :model-value="currentContext.cellData"
    @update:model-value="updateValue"
  />
</template>

<style scoped>
.data-table-cell-editor,
.data-table-cell-editor__display {
  width: 100%;
}

.data-table-cell-editor__display {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
