<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import LayerTreeNode from './LayerTreeNode.vue'

defineOptions({ name: 'LayerPanel' })

const editorStore = useEditorStore()
const { rootChildren, selectedNodeIds } = storeToRefs(editorStore)
const draggingNodeId = ref<string>()
const orderedRootChildren = computed(() => [...rootChildren.value].reverse())

function onDrop(targetId: string) {
  const sourceId = draggingNodeId.value
  draggingNodeId.value = undefined
  if (sourceId) editorStore.moveNodeToSiblingPosition(sourceId, targetId)
}
</script>

<template>
  <div class="layer-panel">
    <div class="layer-panel__content overflow-auto whitespace-nowrap">
      <LayerTreeNode
        v-for="node in orderedRootChildren"
        :key="node.id"
        :node="node"
        :depth="0"
        :selected-node-ids="selectedNodeIds"
        @select="editorStore.selectNode"
        @drag-start="draggingNodeId = $event"
        @drop="onDrop"
      />
    </div>
  </div>
</template>

<style scoped>
.layer-panel {
  height: 100%;
  background: var(--surface-panel);
}

.layer-panel__content {
  width: 160px;
  height: 100%;
  box-sizing: border-box;
  padding: 10px;
  border-right: 1px solid var(--border-color);
}
</style>
