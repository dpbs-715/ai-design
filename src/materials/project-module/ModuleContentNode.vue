<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { isAbsolutePlacement, type MaterialSchema } from '@/schema/material.ts'
import { getMaterialComponent, isMaterialChildrenRenderer } from '@/materials'
import { injectMaterialRenderContext } from '@/context/materialRender.ts'
import { injectRuntimeContext } from '@/runtime/runtimeContextProvider.ts'
import { createMaterialEventProps } from '@/runtime/materialEvents.ts'

defineOptions({ name: 'ModuleContentNode' })

const props = defineProps<{
  node: MaterialSchema
}>()

const renderContext = injectMaterialRenderContext()
const runtimeContext = renderContext.mode === 'runtime' ? injectRuntimeContext() : undefined
const nodeStyle = computed<CSSProperties>(() => {
  if (!isAbsolutePlacement(props.node.placement)) return {}
  return {
    width: `${props.node.placement.width}px`,
    height: `${props.node.placement.height}px`,
    left: `${props.node.placement.x}px`,
    top: `${props.node.placement.y}px`,
  }
})
const eventProps = computed(() =>
  runtimeContext ? createMaterialEventProps(props.node, runtimeContext) : {},
)

function registerInstance(instance: unknown) {
  if (!runtimeContext) return
  if (instance) runtimeContext.registerNodeInstance(props.node.id, instance)
  else runtimeContext.unregisterNodeInstance(props.node.id)
}
</script>

<template>
  <div class="module-content-node" :style="nodeStyle">
    <component
      :ref="registerInstance"
      :is="getMaterialComponent(node.type, renderContext.mode)"
      :schema="node"
      v-bind="eventProps"
    >
      <template v-if="isMaterialChildrenRenderer(node.type)">
        <ModuleContentNode v-for="child in node.children" :key="child.id" :node="child" />
      </template>
    </component>
  </div>
</template>

<style scoped>
.module-content-node {
  position: absolute;
}
</style>
