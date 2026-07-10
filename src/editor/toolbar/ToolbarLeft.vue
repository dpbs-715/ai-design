<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
defineOptions({ name: 'ToolbarLeft' })

const { panelVisible } = useEditorStore()

const { undo, redo, canUndo, canRedo } = useUndoRedo()
</script>

<template>
  <div class="flex gap-20 toolbar-right">
    <span
      :class="{ active: panelVisible.material }"
      @click="panelVisible.material = !panelVisible.material"
    >
      <Icon icon="fluent:panel-left-28-filled" />
    </span>
    <span
      :class="{ active: panelVisible.property }"
      @click="panelVisible.property = !panelVisible.property"
    >
      <Icon icon="fluent:panel-right-28-filled" />
    </span>
    <span :class="{ active: panelVisible.layer }" @click="panelVisible.layer = !panelVisible.layer">
      <Icon icon="fluent:layer-20-filled" />
    </span>
    <span :class="{ disabled: !canUndo }" @click="undo">
      <Icon icon="ic:baseline-undo" />
    </span>
    <span :class="{ disabled: !canRedo }" @click="redo">
      <Icon icon="ic:baseline-redo" />
    </span>
  </div>
</template>

<style scoped lang="scss">
.toolbar-right {
  span {
    padding: 4px;
    border: 1px solid #3b465b;
    border-radius: 3px;
    cursor: pointer;
    &.active {
      background-color: #3b465b;
    }
    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}
</style>
