<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { useDraggable } from 'vue-draggable-plus'

defineOptions({ name: 'LayerPanel' })

const editorStore = useEditorStore()

const { nodes, selectedNodeIds } = storeToRefs(editorStore)

useDraggable('.layer-panel', nodes, { animation: 150, direction: 'horizontal' })
</script>

<template>
  <div class="h-full">
    <div class="h-full layer-panel overflow-auto whitespace-nowrap">
      <div
        v-for="node in nodes"
        :key="node.id"
        :class="{ active: selectedNodeIds.includes(node.id) }"
        @click="editorStore.selectNode(node.id)"
      >
        <span>{{ node.name }}</span>
        <span>
          <Icon icon="fluent:list-bar-24-filled" />
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layer-panel {
  padding: 10px;
  background: var(--surface-panel);
  display: flex;
  flex-direction: column-reverse;
  justify-content: start;

  & > div {
    margin-bottom: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: var(--surface-raised);
    color: var(--text-secondary);
    font-size: 12px;
    transition:
      background-color 140ms ease,
      border-color 140ms ease,
      color 140ms ease;

    &:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    &.active {
      border-color: rgb(123 140 255 / 34%);
      background: var(--accent-soft);
      color: var(--accent-color);
    }
  }
}
</style>
