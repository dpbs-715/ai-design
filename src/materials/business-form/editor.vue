<script setup lang="ts">
import type { CommonFormConfig } from '@vunio/ui'
import { useConfigs, useEventListener } from '@vunio/hooks'
import { useDraggable, type DraggableEvent } from 'vue-draggable-plus'
import { canMaterialTypeBeChild, createNode } from '@/materials'
import { injectMaterialEditorContext } from '@/editor/canvas/materialEditorContext.ts'
import { getDraggedMaterialTemplate } from '@/editor/canvas/materialDrag.ts'
import type { BusinessFormSchema, FormItemSchema } from './schema.ts'
import { toCommonFormConfig } from './formConfig.ts'
import { createInitialFormValues } from './formValues.ts'
import FormItemControl from './FormItemControl.vue'

defineOptions({ name: 'BusinessFormEditorMaterial' })

const { schema } = defineProps<{
  schema: BusinessFormSchema
}>()

const editorContext = injectMaterialEditorContext()
const rootRef = useTemplateRef<HTMLDivElement>('root')
const gridRef = shallowRef<HTMLElement | null>(null)
const insertionIndex = ref<number>()
const insertionLineStyle = ref<Record<string, string>>({})
const formItems = computed(() => schema.children as FormItemSchema[])
const formValues = computed(() => createInitialFormValues(formItems.value))
const schemaConfigs = computed(() => formItems.value.map(toCommonFormConfig))
const configManager = useConfigs<CommonFormConfig>(schemaConfigs, false)
const editorConfigs = computed<CommonFormConfig[]>(() =>
  configManager.config.map((config) => ({
    ...config,
    props: {
      ...config.props,
      disabled: true,
    },
  })),
)

function getGridElement() {
  return rootRef.value?.querySelector<HTMLElement>('.el-row') ?? null
}

function getGridItems() {
  return Array.from(
    getGridElement()?.querySelectorAll<HTMLElement>(':scope > .business-form-editor__item') ?? [],
  )
}

function syncGridMetadata() {
  const grid = getGridElement()
  if (!grid) return
  gridRef.value = grid

  Array.from(grid.children).forEach((element, index) => {
    if (!(element instanceof HTMLElement)) return
    const formItem = formItems.value[index]
    element.classList.toggle('business-form-editor__item', Boolean(formItem))
    element.classList.toggle(
      'is-form-item-selected',
      Boolean(formItem && editorContext.selectedNodeIds.value.includes(formItem.id)),
    )
    if (formItem) {
      element.dataset.nodeId = formItem.id
      element.dataset.parentId = schema.id
    } else {
      delete element.dataset.nodeId
      delete element.dataset.parentId
    }
  })
}

function restoreDraggedItem(event: DraggableEvent<FormItemSchema>) {
  const oldDomIndex = event.oldIndex
  if (oldDomIndex == null) return

  event.item.remove()
  event.from.insertBefore(event.item, event.from.children[oldDomIndex] ?? null)
}

function reorderFormItems(event: DraggableEvent<FormItemSchema>) {
  const oldIndex = event.oldDraggableIndex
  const newIndex = event.newDraggableIndex
  restoreDraggedItem(event)
  if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
  editorContext.reorderChildren(schema.id, oldIndex, newIndex)
}

const sortable = useDraggable<FormItemSchema>(gridRef, formItems, {
  immediate: false,
  animation: 150,
  draggable: '.business-form-editor__item',
  handle: '.business-form-editor__drag-handle',
  ghostClass: 'business-form-editor__item--ghost',
  chosenClass: 'business-form-editor__item--chosen',
  customUpdate: reorderFormItems,
})

onMounted(async () => {
  await nextTick()
  syncGridMetadata()
  const grid = getGridElement()
  if (grid) sortable.start(grid)
})

watch(
  [() => formItems.value.map((item) => item.id), editorContext.selectedNodeIds],
  async () => {
    await nextTick()
    syncGridMetadata()
  },
  { deep: true, flush: 'post' },
)

function onFormMouseDown(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return
  const itemElement = target.closest<HTMLElement>('.business-form-editor__item')
  const item = formItems.value.find((candidate) => candidate.id === itemElement?.dataset.nodeId)
  if (!item) return
  event.stopPropagation()
  editorContext.onNodeMouseDown(item, event)
}

function canDropDraggedMaterial() {
  const template = getDraggedMaterialTemplate()
  return Boolean(template && canMaterialTypeBeChild(schema, template.type))
}

function getInsertionIndex(clientX: number, clientY: number) {
  const items = getGridItems()
  if (!items.length) return 0

  const rows = items.map((element, index) => ({
    index,
    rect: element.getBoundingClientRect(),
  }))
  for (const item of rows) {
    const centerY = item.rect.top + item.rect.height / 2
    const centerX = item.rect.left + item.rect.width / 2
    if (clientY < centerY || (clientY <= item.rect.bottom && clientX < centerX)) {
      return item.index
    }
  }
  return items.length
}

function updateInsertionLine(index: number) {
  const root = rootRef.value
  if (!root) return
  const items = getGridItems()
  const rootRect = root.getBoundingClientRect()
  const scale = root.clientWidth ? rootRect.width / root.clientWidth : 1
  const targetRect =
    index < items.length
      ? items[index].getBoundingClientRect()
      : items.at(-1)?.getBoundingClientRect()

  if (!targetRect) {
    insertionLineStyle.value = {
      left: '16px',
      right: '16px',
      top: '50%',
    }
    return
  }

  const top =
    index < items.length
      ? (targetRect.top - rootRect.top) / scale
      : (targetRect.bottom - rootRect.top) / scale
  insertionLineStyle.value = {
    left: `${(targetRect.left - rootRect.left) / scale}px`,
    top: `${top}px`,
    width: `${targetRect.width / scale}px`,
  }
}

function clearInsertion() {
  insertionIndex.value = undefined
  insertionLineStyle.value = {}
}

function onDragOver(event: DragEvent) {
  if (!canDropDraggedMaterial()) {
    clearInsertion()
    return
  }
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  const index = getInsertionIndex(event.clientX, event.clientY)
  insertionIndex.value = index
  updateInsertionLine(index)
}

function onDragLeave(event: DragEvent) {
  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && rootRef.value?.contains(nextTarget)) return
  clearInsertion()
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  const index = insertionIndex.value ?? formItems.value.length
  clearInsertion()
  if (!canDropDraggedMaterial()) return

  const data = event.dataTransfer?.getData('schema')
  if (!data) return
  try {
    const node = createNode(JSON.parse(data))
    if (editorContext.insertNode(node, schema.id, index)) {
      editorContext.onNodeMouseDown(node, new MouseEvent('mousedown'))
    }
  } catch {
    return
  }
}

useEventListener('dragend', clearInsertion)
</script>

<template>
  <div
    ref="root"
    class="business-form-editor"
    @mousedown="onFormMouseDown"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div v-if="!formItems.length" class="business-form-editor__empty">拖入表单字段</div>
    <CommonForm
      :model-value="formValues"
      :config="editorConfigs"
      :label-position="schema.props.labelPosition"
      :label-width="`${schema.props.labelWidth}px`"
      :size="schema.props.size"
    >
      <template
        v-for="item in formItems"
        :key="item.id"
        #[item.props.field]="{ config, modelValue }"
      >
        <div class="business-form-editor__field" :data-node-id="item.id">
          <button
            v-if="!editorContext.isNodeLocked(item.id)"
            type="button"
            class="business-form-editor__drag-handle"
            aria-label="拖拽调整字段顺序"
          >
            <Icon icon="fluent:re-order-dots-vertical-20-regular" width="16" />
          </button>
          <FormItemControl
            class="business-form-editor__control"
            :node="item"
            :model-value="modelValue"
            :config="{
              ...config,
              props: { ...config.props, disabled: true },
            }"
          />
        </div>
      </template>
    </CommonForm>
    <div
      v-if="insertionIndex !== undefined"
      class="business-form-editor__insertion-line"
      :style="insertionLineStyle"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.business-form-editor {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  overflow: auto;
  background: var(--surface-panel);
}

.business-form-editor__empty {
  position: absolute;
  inset: 16px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--border-color-strong);
  color: var(--text-muted);
  font-size: 13px;
  pointer-events: none;
}

.business-form-editor__field {
  position: relative;
  width: 100%;
}

.business-form-editor__drag-handle {
  position: absolute;
  z-index: 2;
  top: 50%;
  right: 6px;
  display: grid;
  width: 22px;
  height: 24px;
  padding: 0;
  place-items: center;
  transform: translateY(-50%);
  border: 0;
  border-radius: 4px;
  background: var(--surface-raised);
  color: var(--text-muted);
  cursor: grab;
}

.business-form-editor__drag-handle:active {
  cursor: grabbing;
}

.business-form-editor__control {
  width: 100%;
  pointer-events: none;
}

.business-form-editor__insertion-line {
  position: absolute;
  z-index: 5;
  height: 2px;
  transform: translateY(-1px);
  border-radius: 999px;
  background: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
  pointer-events: none;
}

.business-form-editor :deep(.business-form-editor__item) {
  position: relative;
  border-radius: 6px;
  outline: 1px solid transparent;
  outline-offset: -3px;
}

.business-form-editor :deep(.business-form-editor__item.is-form-item-selected) {
  outline: 2px solid var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, transparent);
}

.business-form-editor :deep(.business-form-editor__item--ghost) {
  opacity: 0.3;
}

.business-form-editor :deep(.business-form-editor__item--chosen) {
  z-index: 4;
}
</style>
