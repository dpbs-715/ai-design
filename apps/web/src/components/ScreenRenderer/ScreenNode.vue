<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { isAbsolutePlacement, type MaterialSchema } from '@/schema/material.ts'
import { getMaterialComponent, isMaterialChildrenRenderer } from '@/materials'
import type { RuntimeContext } from '@/runtime/context.ts'
import { createMaterialEventProps } from '@/runtime/materialEvents.ts'

defineOptions({ name: 'ScreenNode' })

const props = defineProps<{
  node: MaterialSchema
  context: RuntimeContext
}>()

const nodeStyle = computed<CSSProperties>(() => {
  if (!isAbsolutePlacement(props.node.placement)) return {}
  return {
    width: `${props.node.placement.width}px`,
    height: `${props.node.placement.height}px`,
    left: `${props.node.placement.x}px`,
    top: `${props.node.placement.y}px`,
  }
})

function registerInstance(instance: unknown) {
  if (instance) props.context.registerNodeInstance(props.node.id, instance)
  else props.context.unregisterNodeInstance(props.node.id)
}
</script>

<template>
  <div class="screen-node" :style="nodeStyle">
    <component
      :ref="registerInstance"
      :is="getMaterialComponent(node.type)"
      :schema="node"
      v-bind="createMaterialEventProps(node, context)"
    >
      <template v-if="isMaterialChildrenRenderer(node.type)">
        <ScreenNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :context="context"
        />
      </template>
    </component>
  </div>
</template>

<style scoped>
.screen-node {
  position: absolute;
}
</style>
