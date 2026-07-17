<script setup lang="ts">
import { useEditorPanelStore } from '@/stores/editorPanel.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { storeToRefs } from 'pinia'
defineOptions({ name: 'ToolbarLeft' })

const editorPanelStore = useEditorPanelStore()
const { panelVisible } = storeToRefs(editorPanelStore)

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
      @click="editorPanelStore.togglePanel('material')"
    >
      <Icon icon="fluent:panel-left-28-filled" />
    </button>
    <button
      type="button"
      class="toolbar-button"
      :class="{ active: panelVisible.layer }"
      title="切换图层面板"
      aria-label="切换图层面板"
      @click="editorPanelStore.togglePanel('layer')"
    >
      <Icon icon="fluent:layer-20-filled" />
    </button>
    <button
      type="button"
      class="toolbar-button"
      :class="{ active: panelVisible.property }"
      title="切换属性面板"
      aria-label="切换属性面板"
      @click="editorPanelStore.togglePanel('property')"
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
</style>
