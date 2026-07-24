<script setup lang="ts">
import { canMaterialAcceptChild, createNode } from '@/materials'
import Selecto from 'vue3-selecto'
import Moveable from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import type { MaterialSchema } from '@/schema/material.ts'
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

const { isMoveableActive, onDrag, onStart, onEnd, onResize, onDragGroup, onResizeGroup } =
  useMoveable()
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

function onNodeMouseDown(node: MaterialSchema, event: MouseEvent) {
  if (event.button !== 0 || isCanvasPanMode.value) return
  if (editorStore.getNodeLockKey(node.id)) {
    onClearSelected()
    return
  }
  onSelect(node, event)
}

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

function getDropTarget(clientX: number, clientY: number) {
  const stage = stageRef.value
  if (!stage) return null
  return findCanvasDropTarget(stage, root.value.id, clientX, clientY, scale.value)
}

function onDrop(e: DragEvent) {
  dropTargetId.value = undefined
  const data = e.dataTransfer.getData('schema')
  if (!data) return
  let node: MaterialSchema
  try {
    node = createNode(JSON.parse(data))
  } catch {
    return
  }

  const dropTarget = getDropTarget(e.clientX, e.clientY)
  if (!dropTarget) return
  const parentId = dropTarget.parentId
  const parent = parentId === root.value.id ? root.value : editorStore.findNode(parentId)
  if (!parent || !canMaterialAcceptChild(parent, node)) return

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
  const dropTarget = getDropTarget(event.clientX, event.clientY)
  if (
    dropTarget?.parentId !== root.value.id &&
    dropTarget?.parentId &&
    editorStore.getNodeLockKey(dropTarget.parentId)
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

const moveableBounds = computed(() => {
  const parentIds = new Set(
    selectedNodeIds.value.flatMap((id) => {
      const parentId = editorStore.findParentId(id)
      return parentId ? [parentId] : []
    }),
  )
  const parentId = parentIds.size === 1 ? parentIds.values().next().value : root.value.id
  const parentRect = editorStore.getContainerContentRect(parentId) ?? {
    x: 0,
    y: 0,
    width: canvasWidth.value,
    height: canvasHeight.value,
  }

  return {
    position: 'css' as const,
    left: parentRect.x,
    top: parentRect.y,
    right: canvasWidth.value - parentRect.x - parentRect.width,
    bottom: canvasHeight.value - parentRect.y - parentRect.height,
  }
})
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
          @dragover.prevent="onDragOver"
          @dragleave.self="dropTargetId = undefined"
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
      :min-width="1"
      :min-height="1"
      :origin="false"
      :snappable="true"
      :snapContainer="stageRef"
      :bounds="moveableBounds"
      @drag="onDrag"
      @dragStart="onStart"
      @dragEnd="onEnd"
      @dragGroup="onDragGroup"
      @dragGroupStart="onStart"
      @dragGroupEnd="onEnd"
      @resize="onResize"
      @resizeStart="onStart"
      @resizeEnd="onEnd"
      @resizeGroup="onResizeGroup"
      @resizeGroupStart="onStart"
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
