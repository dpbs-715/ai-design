<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
defineOptions({ name: 'ToolbarLeft' })

const { panelVisible } = useEditorStore()

const { undo, redo, canUndo, canRedo } = useUndoRedo()
</script>

<template>
  <div class="toolbar flex items-center">
    <button
      type="button"
      class="toolbar-button"
      :class="{ active: panelVisible.material }"
      title="切换素材面板"
      aria-label="切换素材面板"
      @click="panelVisible.material = !panelVisible.material"
    >
      <Icon icon="fluent:panel-left-28-filled" />
    </button>
    <button
      type="button"
      class="toolbar-button"
      :class="{ active: panelVisible.layer }"
      title="切换图层面板"
      aria-label="切换图层面板"
      @click="panelVisible.layer = !panelVisible.layer"
    >
      <Icon icon="fluent:layer-20-filled" />
    </button>
    <button
      type="button"
      class="toolbar-button"
      :class="{ active: panelVisible.property }"
      title="切换属性面板"
      aria-label="切换属性面板"
      @click="panelVisible.property = !panelVisible.property"
    >
      <Icon icon="fluent:panel-right-28-filled" />
    </button>
    <span class="toolbar-divider"></span>
    <button
      type="button"
      class="toolbar-button"
      :disabled="!canUndo"
      title="撤销"
      aria-label="撤销"
      @click="undo"
    >
      <Icon icon="ic:baseline-undo" />
    </button>
    <button
      type="button"
      class="toolbar-button"
      :disabled="!canRedo"
      title="重做"
      aria-label="重做"
      @click="redo"
    >
      <Icon icon="ic:baseline-redo" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  gap: 4px;
}

.toolbar-button {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease;

  &:hover:not(:disabled) {
    background: var(--surface-raised);
    color: var(--text-primary);
  }

  &.active {
    border-color: rgb(123 140 255 / 22%);
    background: var(--accent-soft);
    color: var(--accent-color);
  }

  &:disabled {
    color: var(--text-muted);
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: var(--border-color);
}
</style>
