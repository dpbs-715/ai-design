<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import { resolveDialogMaterialConfig } from './config.ts'

defineOptions({ name: 'DialogMaterialEditor', inheritAttrs: false })

const { editorActive = false, schema } = defineProps<{
  editorActive?: boolean
  schema: MaterialSchema
}>()

const emit = defineEmits<{
  editorClose: []
  editorOpen: []
}>()

const attrs = useAttrs()
const config = computed(() => resolveDialogMaterialConfig(schema))
const contentStyle = computed<CSSProperties>(() => ({
  overflow:
    schema.childrenLayout?.type === 'absolute' && schema.childrenLayout.clip ? 'hidden' : 'visible',
}))

function open() {
  emit('editorOpen')
}

function close() {
  emit('editorClose')
}

function toggle() {
  if (editorActive) close()
  else open()
}

defineExpose({ close, open, toggle })
</script>

<template>
  <div class="dialog-material-editor">
    <header class="dialog-material-editor__header">
      <span class="dialog-material-editor__identity">
        <Icon icon="fluent:window-20-regular" width="16" />
        <strong>{{ config.title }}</strong>
      </span>
      <span class="dialog-material-editor__tools">
        <small>弹窗编辑</small>
      </span>
    </header>
    <div v-bind="attrs" class="dialog-material-editor__content" :style="contentStyle">
      <div v-if="!schema.children.length" class="dialog-material-editor__empty">
        <Icon icon="fluent:add-square-20-regular" width="18" />
        <span>拖入弹窗内容</span>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.dialog-material-editor {
  display: grid;
  width: 100%;
  height: 100%;
  overflow: hidden;
  grid-template-rows: 52px minmax(0, 1fr);
  box-sizing: border-box;
  border: 1px solid var(--border-color-strong);
  border-radius: 10px;
  background: var(--surface-raised);
  box-shadow:
    0 18px 44px color-mix(in srgb, #000 16%, transparent),
    0 0 0 5px color-mix(in srgb, var(--accent-color) 7%, transparent);
}

.dialog-material-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px 0 18px;
  border-bottom: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--surface-panel) 94%, var(--accent-soft));
}

.dialog-material-editor__identity,
.dialog-material-editor__tools {
  display: inline-flex;
  min-width: 0;
  align-items: center;
}

.dialog-material-editor__identity {
  gap: 8px;
  color: var(--text-primary);

  > svg {
    flex: none;
    color: var(--accent-color);
  }

  strong {
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dialog-material-editor__tools {
  flex: none;
  gap: 10px;
  color: var(--text-muted);

  small {
    padding: 3px 7px;
    border: 1px solid color-mix(in srgb, var(--accent-color) 30%, var(--border-color));
    border-radius: 99px;
    background: var(--accent-soft);
    color: var(--accent-color);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
}

.dialog-material-editor__content {
  position: relative;
  min-height: 0;
  background:
    linear-gradient(var(--border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-color) 1px, transparent 1px), var(--surface-raised);
  background-size: 20px 20px;
}

.dialog-material-editor__empty {
  position: absolute;
  inset: 16px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 7px;
  border: 1px dashed var(--border-color-strong);
  border-radius: 7px;
  color: var(--text-muted);
  font-size: 12px;
  pointer-events: none;

  svg {
    color: var(--accent-color);
  }
}
</style>
