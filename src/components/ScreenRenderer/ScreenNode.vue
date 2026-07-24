<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import { getMaterialComponent } from '@/materials'
import type { RuntimeContext } from '@/runtime/context.ts'

defineOptions({ name: 'ScreenNode' })

const props = defineProps<{
  node: MaterialSchema
  context: RuntimeContext
}>()

const nodeStyle = computed<CSSProperties>(() => ({
  width: `${props.node.placement.width}px`,
  height: `${props.node.placement.height}px`,
  left: `${props.node.placement.x}px`,
  top: `${props.node.placement.y}px`,
}))

function registerInstance(instance: unknown) {
  if (instance) props.context.registerNodeInstance(props.node.id, instance)
  else props.context.unregisterNodeInstance(props.node.id)
}

function createEvents() {
  const listeners: Record<string, (...args: any[]) => any> = {}
  const events = props.node.events ?? []
  events.forEach((event) => {
    const previousListener = listeners[event.type]
    listeners[event.type] = (payload) => {
      previousListener?.(payload)
      return props.context.executeEvent(props.node, event, payload)
    }
  })
  return listeners
}
</script>

<template>
  <div class="screen-node" :style="nodeStyle">
    <component
      :ref="registerInstance"
      :is="getMaterialComponent(node.type)"
      :schema="node"
      v-on="createEvents()"
    >
      <ScreenNode v-for="child in node.children" :key="child.id" :node="child" :context="context" />
    </component>
  </div>
</template>

<style scoped>
.screen-node {
  position: absolute;
}
</style>
