<script setup lang="ts">
import CanvasProperty from '@/editor/panels/property/components/CanvasProperty.vue'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import NodeProperty from '@/editor/panels/property/components/NodeProperty.vue'

defineOptions({ name: 'PropertyPanel' })

const editorStore = useEditorStore()
const { selectedNode } = storeToRefs(editorStore)
</script>

<template>
  <div class="property-panel editor-pane">
    <NodeProperty v-if="selectedNode" />
    <CanvasProperty v-else />
  </div>
</template>

<style scoped lang="scss">
.property-panel {
  height: 100%;
  background: var(--surface-panel);
  color: var(--text-secondary);
}
</style>
