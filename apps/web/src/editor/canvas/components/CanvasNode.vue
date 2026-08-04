<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { isAbsolutePlacement, type MaterialSchema } from '@/schema/material.ts'
import {
  getMaterialComponent,
  isContainerMaterial,
  isMaterialChildrenRenderer,
  isOverlayMaterial,
} from '@/materials'
import { useEditorStore } from '@/stores/editor.ts'
import type { RuntimeContext } from '@/runtime/context.ts'

defineOptions({ name: 'CanvasNode' })

const editorStore = useEditorStore()
const props = withDefaults(
  defineProps<{
    node: MaterialSchema
    parentId: string
    runtimeContext: RuntimeContext
    editorVisible?: boolean
    overlayActive?: boolean
    rootChild?: boolean
    dropTargetId?: string
    onNodeMouseDown: (node: MaterialSchema, event: MouseEvent) => void
    onOverlayOpen?: (nodeId: string) => void
    onOverlayClose?: (nodeId: string) => void
  }>(),
  {
    editorVisible: true,
    overlayActive: false,
    rootChild: false,
  },
)

const nodeStyle = computed<CSSProperties>(() => {
  if (!isAbsolutePlacement(props.node.placement)) return {}
  return {
    width: `${props.node.placement.width}px`,
    height: `${props.node.placement.height}px`,
    left: `${props.node.placement.x}px`,
    top: `${props.node.placement.y}px`,
  }
})
const isContainer = computed(() => isContainerMaterial(props.node.type))
const isOverlay = computed(() => isOverlayMaterial(props.node.type))
const rendersChildren = computed(() => isMaterialChildrenRenderer(props.node.type))
const editorStateProps = computed(() =>
  isOverlay.value ? { editorActive: props.overlayActive === true } : {},
)
const isDropTarget = computed(() => isContainer.value && props.node.id === props.dropTargetId)
const effectiveLockKey = computed(() => editorStore.getNodeLockKey(props.node.id))

function onMouseDown(event: MouseEvent) {
  props.onNodeMouseDown(props.node, event)
}

function registerInstance(instance: unknown) {
  if (instance) props.runtimeContext.registerNodeInstance(props.node.id, instance)
  else props.runtimeContext.unregisterNodeInstance(props.node.id)
}

function onEditorOpen() {
  props.onOverlayOpen?.(props.node.id)
}

function onEditorClose() {
  props.onOverlayClose?.(props.node.id)
}
</script>

<template>
  <div
    v-show="editorVisible !== false"
    class="canvas-node"
    :class="{
      'is-locked': effectiveLockKey,
      'is-editor-hidden': editorVisible === false,
      'is-active-overlay': overlayActive,
      'is-root-child': rootChild,
      'is-container': isContainer,
      'is-drop-target': isDropTarget,
    }"
    :style="nodeStyle"
    :data-node-id="node.id"
    :data-parent-id="parentId"
    @mousedown.stop="onMouseDown"
  >
    <component
      :ref="registerInstance"
      :is="getMaterialComponent(node.type, 'editor')"
      v-bind="editorStateProps"
      :schema="node"
      :data-container-id="isContainer ? node.id : undefined"
      @editor-open="onEditorOpen"
      @editor-close="onEditorClose"
    >
      <template v-if="rendersChildren">
        <CanvasNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :parent-id="node.id"
          :runtime-context="runtimeContext"
          :drop-target-id="dropTargetId"
          :on-node-mouse-down="onNodeMouseDown"
          :on-overlay-open="onOverlayOpen"
          :on-overlay-close="onOverlayClose"
        />
      </template>
    </component>
    <div v-if="isDropTarget" class="canvas-node__drop-feedback" aria-hidden="true">
      <span class="canvas-node__drop-label">
        <Icon icon="fluent:arrow-enter-20-filled" width="15" />
        <span class="canvas-node__drop-label-text">松开放入 {{ node.name }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.canvas-node {
  position: absolute;
  isolation: isolate;
}

.canvas-node.is-active-overlay {
  z-index: 2;
}

.canvas-node.is-container.is-drop-target {
  outline: 2px solid var(--accent-color);
  outline-offset: 3px;
}

.canvas-node__drop-feedback {
  position: absolute;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  border: 2px dashed var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 16%, transparent);
  box-shadow:
    inset 0 0 0 3px var(--accent-soft),
    0 0 0 4px var(--accent-soft);
  pointer-events: none;
  animation: drop-feedback-enter 120ms ease-out;
}

.canvas-node__drop-label {
  display: inline-flex;
  max-width: calc(100% - 24px);
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent-color) 58%, var(--border-color));
  border-radius: 6px;
  background: var(--surface-panel);
  box-shadow: 0 4px 14px color-mix(in srgb, #000 24%, transparent);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-node__drop-label :deep(svg) {
  flex: none;
  color: var(--accent-color);
}

.canvas-node__drop-label-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes drop-feedback-enter {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .canvas-node__drop-feedback {
    animation: none;
  }
}
</style>
