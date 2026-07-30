<script setup lang="ts">
import type { MaterialDefinition } from '@/schema/material.ts'
import { finishMaterialDrag, startMaterialDrag } from '@/editor/canvas/materialDrag.ts'

defineOptions({ name: 'MaterialItem' })

const { material } = defineProps<{
  material: MaterialDefinition
}>()

function onStart(e: DragEvent) {
  startMaterialDrag(material.schema)
  e.dataTransfer?.setData('schema', JSON.stringify(material.schema))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <div
    class="material-item whitespace-nowrap"
    draggable="true"
    :aria-label="`拖拽添加${material.name}`"
    @dragstart="onStart"
    @dragend="finishMaterialDrag"
  >
    <div class="preview">
      <component :is="material.preview.component" v-bind="material.preview.props" />
    </div>
    <div class="meta">
      <span class="title" :title="material.name">{{ material.name }}</span>
      <Icon class="drag-handle" icon="mdi:drag" width="15" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.material-item {
  padding: 10px 0 8px;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border-color);
  cursor: grab;

  .preview {
    display: flex;
    height: 54px;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: var(--surface-workbench);
    color: var(--text-muted);
    box-shadow: inset 0 0 0 1px var(--border-color);
    overflow: hidden;
    transition:
      background-color 140ms ease,
      box-shadow 140ms ease,
      color 140ms ease;
  }

  .meta {
    display: flex;
    height: 26px;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
  }

  .title {
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    text-overflow: ellipsis;
  }

  .drag-handle {
    flex: none;
    color: var(--text-muted);
  }

  transition:
    opacity 140ms ease,
    color 140ms ease;

  &:hover {
    .preview {
      background: var(--surface-raised);
      color: var(--text-secondary);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-color) 48%, transparent);
    }

    .title,
    .drag-handle {
      color: var(--text-primary);
    }
  }

  &:active {
    cursor: grabbing;
    opacity: 0.72;
  }
}
</style>
