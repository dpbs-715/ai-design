<script setup lang="ts">
import { canMaterialAcceptChild, canMaterialTypeBeChild, createNode } from '@/materials'
import Selecto from 'vue3-selecto'
import Moveable from 'vue3-moveable'
import { useEventListener } from '@vunio/hooks'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { isAbsolutePlacement, type MaterialSchema } from '@/schema/material.ts'
import SketchRuler from 'vue3-sketch-ruler'
import 'vue3-sketch-ruler/lib/style.css'
import { useCanvasRuler } from '@/editor/canvas/composables/useCanvasRuler.ts'
import { useCanvasZoom } from '@/editor/canvas/composables/useCanvasZoom.ts'
import { useMoveable } from '@/editor/canvas/composables/useMoveable.ts'
import { useSelection, type CanvasSelectoRef } from '@/editor/canvas/composables/useSelection.ts'
import NodeContextMenu from '@/editor/canvas/components/NodeContextMenu.vue'
import CanvasContextMenu from '@/editor/canvas/components/CanvasContextMenu.vue'
import CanvasZoomControl from '@/editor/canvas/components/CanvasZoomControl.vue'
import CanvasNode from '@/editor/canvas/components/CanvasNode.vue'
import CanvasBackground from '@/components/CanvasBackground/index.vue'
import { useCanvasContextMenu } from '@/editor/canvas/composables/useCanvasContextMenu.ts'
import { useCanvasViewport } from '@/editor/canvas/composables/useCanvasViewport.ts'
import { useCanvasShortcutFocus } from '@/editor/canvas/composables/useCanvasShortcutFocus.ts'
import { useCanvasClipboardActions } from '@/editor/canvas/composables/useCanvasClipboardActions.ts'
import { useCanvasShortcuts } from '@/editor/canvas/composables/useCanvasShortcuts.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'
import { provideMaterialRenderContext } from '@/context/materialRender.ts'
import { findCanvasDropTarget } from '@/editor/canvas/canvasTarget.ts'
import { provideMaterialEditorContext } from '@/editor/canvas/materialEditorContext.ts'
import { getDraggedMaterialTemplate } from '@/editor/canvas/materialDrag.ts'

defineOptions({
  name: 'CanvasRoot',
})
const editorStore = useEditorStore()
provideMaterialRenderContext({ mode: 'editor' })
const canvasRootRef = useTemplateRef<HTMLDivElement>('canvasRoot')
const moveableRef = useTemplateRef('moveable')
const selectoRef = useTemplateRef<CanvasSelectoRef>('selecto')
const stageRef = useTemplateRef('stage')
const dropTargetId = ref<string>()

const {
  height: viewportHeight,
  width: viewportWidth,
  measured: viewportMeasured,
} = useCanvasViewport(canvasRootRef)
useCanvasShortcutFocus(canvasRootRef)
const { root, rootChildren, selectedNodeIds } = storeToRefs(editorStore)
const { resolvedMode, rootStyle: renderThemeStyle } = useRenderTheme()

const {
  isMoveableActive,
  onDrag,
  onStart,
  onResizeStart,
  onResizeGroupStart,
  onEnd,
  onResize,
  onDragGroup,
  onResizeGroup,
} = useMoveable()
const {
  canvasWidth,
  canvasHeight,
  canvasStyle,
  scale,
  lines,
  palette,
  updateMoveableRect,
  onCanvasTransformChange,
} = useCanvasRuler({
  moveableRef,
  isMoveableActive,
})
const { isCanvasPanMode, isCanvasPanning, fitCanvas, centerCanvas, setCanvasScale, isCanvasFit } =
  useCanvasZoom({
    viewportWidth,
    viewportHeight,
    viewportMeasured,
    canvasWidth,
    canvasHeight,
    scale,
  })
const { selectedTarget, onSelect, onClearSelected, onSelectEnd } = useSelection({
  stageRef,
  selectoRef,
  moveableRef,
  isMoveableActive,
})
const { copyNodes, cutNodes, pasteAt, pasteFromClipboard } = useCanvasClipboardActions()
const {
  contextMenuTarget,
  contextMenuNodes,
  contextMenuAnchor,
  onContextMenu,
  closeContextMenu,
  onContextMenuCommand,
} = useCanvasContextMenu({ canvasRootRef, stageRef, scale, copyNodes, pasteAt })
useCanvasShortcuts({ copyNodes, cutNodes, pasteFromClipboard, closeContextMenu })

function onStageMouseDown(event: MouseEvent) {
  if (event.target === stageRef.value && !event.shiftKey && !isCanvasPanMode.value) {
    onClearSelected()
  }
}

function findUnlockedNodeAtPoint(event: MouseEvent) {
  const stage = stageRef.value
  if (!stage) return

  const visitedNodeIds = new Set<string>()
  for (const element of document.elementsFromPoint(event.clientX, event.clientY)) {
    const nodeElement = element.closest<HTMLElement>('[data-node-id]')
    const nodeId = nodeElement?.dataset.nodeId
    if (!nodeElement || !nodeId || !stage.contains(nodeElement) || visitedNodeIds.has(nodeId)) {
      continue
    }

    visitedNodeIds.add(nodeId)
    const node = editorStore.findNode(nodeId)
    if (node && !editorStore.getNodeLockKey(node.id)) return node
  }
}

function onNodeMouseDown(node: MaterialSchema, event: MouseEvent) {
  if (event.button !== 0 || isCanvasPanMode.value) return
  const targetNode = editorStore.getNodeLockKey(node.id) ? findUnlockedNodeAtPoint(event) : node
  if (!targetNode) {
    onClearSelected()
    return
  }
  onSelect(targetNode, event)
}

provideMaterialEditorContext({
  selectedNodeIds,
  isNodeLocked: (id) => Boolean(editorStore.getNodeLockKey(id)),
  onNodeMouseDown,
  insertNode: (node, parentId, index) => editorStore.addNode(node, parentId, index),
  reorderChildren: editorStore.reorderChildren,
})

function onCanvasMouseDown(event: MouseEvent) {
  onStageMouseDown(event)
  closeContextMenu()
}

let canvasTransformActive = false
let canvasTransformIdleFrame: number | undefined

function onCanvasTransform() {
  onCanvasTransformChange()
  // SketchRuler keeps emitting during easing. Close once per transform session so a context
  // menu opened during the trailing frames is not immediately unmounted again.
  if (!canvasTransformActive) {
    canvasTransformActive = true
    closeContextMenu()
  }

  if (canvasTransformIdleFrame !== undefined) cancelAnimationFrame(canvasTransformIdleFrame)
  canvasTransformIdleFrame = requestAnimationFrame(() => {
    canvasTransformIdleFrame = requestAnimationFrame(() => {
      canvasTransformIdleFrame = undefined
      canvasTransformActive = false
    })
  })
}

onScopeDispose(() => {
  if (canvasTransformIdleFrame !== undefined) cancelAnimationFrame(canvasTransformIdleFrame)
})

watch(
  isCanvasPanning,
  (panning, _, onCleanup) => {
    if (!panning) {
      onCanvasTransformChange()
      return
    }

    let syncFrame: number | undefined
    const syncMoveable = () => {
      updateMoveableRect()
      syncFrame = requestAnimationFrame(syncMoveable)
    }
    syncMoveable()

    onCleanup(() => {
      if (syncFrame !== undefined) cancelAnimationFrame(syncFrame)
    })
  },
  { flush: 'post' },
)

function getDropTarget(clientX: number, clientY: number, childType?: string) {
  const stage = stageRef.value
  if (!stage) return null
  return findCanvasDropTarget(
    stage,
    root.value.id,
    clientX,
    clientY,
    scale.value,
    childType
      ? (parentId) => {
          const parent = parentId === root.value.id ? root.value : editorStore.findNode(parentId)
          return Boolean(
            parent &&
            canMaterialTypeBeChild(parent, childType) &&
            (parentId === root.value.id || !editorStore.getNodeLockKey(parentId)),
          )
        }
      : undefined,
  )
}

function clearDropTarget() {
  dropTargetId.value = undefined
}

function onDragLeave(event: DragEvent) {
  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && stageRef.value?.contains(nextTarget)) return
  clearDropTarget()
}

useEventListener('dragend', clearDropTarget)

function onDrop(e: DragEvent) {
  clearDropTarget()
  const data = e.dataTransfer.getData('schema')
  if (!data) return
  let node: MaterialSchema
  try {
    node = createNode(JSON.parse(data))
  } catch {
    return
  }

  const dropTarget = getDropTarget(e.clientX, e.clientY, node.type)
  if (!dropTarget) return
  const parentId = dropTarget.parentId
  const parent = parentId === root.value.id ? root.value : editorStore.findNode(parentId)
  if (!parent || !canMaterialAcceptChild(parent, node) || !isAbsolutePlacement(node.placement)) {
    return
  }

  const x = dropTarget.point.x - node.placement.width / 2
  const y = dropTarget.point.y - node.placement.height / 2
  node.placement.x = Math.min(Math.max(x, 0), Math.max(dropTarget.width - node.placement.width, 0))
  node.placement.y = Math.min(
    Math.max(y, 0),
    Math.max(dropTarget.height - node.placement.height, 0),
  )
  if (editorStore.addNode(node, parentId)) editorStore.selectNode(node.id)
}

function onDragOver(event: DragEvent) {
  const template = getDraggedMaterialTemplate()
  if (!template || template.placement.type !== 'absolute') {
    clearDropTarget()
    return
  }

  const dropTarget = getDropTarget(event.clientX, event.clientY, template.type)
  const parent =
    dropTarget?.parentId === root.value.id ? root.value : editorStore.findNode(dropTarget?.parentId)
  if (
    !dropTarget ||
    !parent ||
    !canMaterialTypeBeChild(parent, template.type) ||
    (dropTarget.parentId !== root.value.id && editorStore.getNodeLockKey(dropTarget.parentId))
  ) {
    dropTargetId.value = undefined
    return
  }
  dropTargetId.value = dropTarget?.parentId === root.value.id ? undefined : dropTarget?.parentId
}

const stageStyle = computed(() => ({
  ...canvasStyle.value,
  ...renderThemeStyle.value,
}))

const selectedParentId = computed(() => {
  const parentIds = new Set(
    selectedNodeIds.value.flatMap((id) => {
      const parentId = editorStore.findParentId(id)
      return parentId ? [parentId] : []
    }),
  )
  return parentIds.size === 1 ? parentIds.values().next().value : root.value.id
})

const moveableSnapContainer = computed(() => {
  const stage = stageRef.value
  if (!stage || selectedParentId.value === root.value.id) return stage

  return (
    Array.from(stage.querySelectorAll<HTMLElement>('[data-container-id]')).find(
      (element) => element.dataset.containerId === selectedParentId.value,
    ) ?? stage
  )
})

const moveableBounds = {
  position: 'css' as const,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
}
</script>

<template>
  <div
    class="canvas-root"
    :class="{ 'is-canvas-pan-mode': isCanvasPanMode }"
    ref="canvasRoot"
    @mousedown.capture="onCanvasMouseDown"
    @contextmenu.capture="onContextMenu"
  >
    <SketchRuler
      v-if="viewportMeasured"
      ref="sketchRuler"
      v-model:scale="scale"
      :palette="palette"
      :width="viewportWidth"
      :height="viewportHeight"
      :canvasWidth="canvasWidth"
      :canvasHeight="canvasHeight"
      :thick="20"
      :lines="lines"
      :enable-animation="true"
      animation-mode="ease-out"
      @zoomchange="onCanvasTransform"
    >
      <template #default>
        <div
          ref="stage"
          class="canvas-stage"
          :data-render-theme="resolvedMode"
          :style="stageStyle"
          @dragover.capture.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <CanvasBackground :background="root.style.background" />
          <CanvasNode
            v-for="node in rootChildren"
            :key="node.id"
            :node="node"
            :parent-id="root.id"
            :root-child="true"
            :drop-target-id="dropTargetId"
            :on-node-mouse-down="onNodeMouseDown"
          />
        </div>
      </template>
      <template #toolbar="{ state }">
        <CanvasZoomControl
          class="canvas-zoom"
          :scale="state.scale"
          :fit-active="isCanvasFit(state)"
          @fit="fitCanvas"
          @center="centerCanvas"
          @zoom="setCanvasScale"
        />
      </template>
    </SketchRuler>
    <el-dropdown
      v-if="contextMenuTarget"
      ref="contextMenu"
      trigger="contextmenu"
      virtual-triggering
      :virtual-ref="contextMenuAnchor"
      :show-arrow="false"
      placement="bottom-start"
      popper-class="node-context-menu-popper"
      @command="onContextMenuCommand"
    >
      <template #dropdown>
        <CanvasContextMenu v-if="contextMenuTarget.kind === 'canvas'" />
        <NodeContextMenu v-else :nodes="contextMenuNodes" :target-kind="contextMenuTarget.kind" />
      </template>
    </el-dropdown>
    <Selecto
      v-if="stageRef && !isCanvasPanMode"
      ref="selecto"
      :container="stageRef"
      :dragContainer="stageRef"
      :selectableTargets="['.canvas-node.is-root-child:not(.is-locked)']"
      :selectFromInside="false"
      :toggleContinueSelect="'shift'"
      @selectEnd="onSelectEnd"
    ></Selecto>
    <Moveable
      v-if="selectedNodeIds.length && selectedTarget.length"
      ref="moveable"
      :target="selectedTarget"
      :draggable="!isCanvasPanMode"
      :resizable="true"
      :origin="false"
      :snappable="true"
      :snapContainer="moveableSnapContainer"
      :bounds="moveableBounds"
      @drag="onDrag"
      @dragStart="onStart"
      @dragEnd="onEnd"
      @dragGroup="onDragGroup"
      @dragGroupStart="onStart"
      @dragGroupEnd="onEnd"
      @resize="onResize"
      @resizeStart="onResizeStart"
      @resizeEnd="onEnd"
      @resizeGroup="onResizeGroup"
      @resizeGroupStart="onResizeGroupStart"
      @resizeGroupEnd="onEnd"
    ></Moveable>
  </div>
</template>

<style scoped lang="scss">
.canvas-root {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: var(--surface-workbench);

  .canvas-stage {
    position: relative;
    box-shadow: var(--el-box-shadow-light);
  }

  .canvas-zoom {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 10;
  }
}

.canvas-root.is-canvas-pan-mode {
  .canvas-stage,
  :deep(.moveable-control-box) {
    pointer-events: none;
  }
}
</style>
