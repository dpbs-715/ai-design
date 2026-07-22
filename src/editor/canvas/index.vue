<script setup lang="ts">
import { createNode, getMaterialComponent } from '@/materials'
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
import { useSelection } from '@/editor/canvas/composables/useSelection.ts'
import NodeContextMenu from '@/editor/canvas/components/NodeContextMenu.vue'
import CanvasContextMenu from '@/editor/canvas/components/CanvasContextMenu.vue'
import CanvasZoomControl from '@/editor/canvas/components/CanvasZoomControl.vue'
import { dispatchEventHandlers } from '@/utils/dispatchEventHandlers.ts'
import { useCanvasContextMenu } from '@/editor/canvas/composables/useCanvasContextMenu.ts'
import { useCanvasViewport } from '@/editor/canvas/composables/useCanvasViewport.ts'
import { useCanvasShortcutFocus } from '@/editor/canvas/composables/useCanvasShortcutFocus.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'
import { provideMaterialRenderContext } from '@/context/materialRender.ts'

defineOptions({
  name: 'CanvasRoot',
})
const editorStore = useEditorStore()
provideMaterialRenderContext({ mode: 'editor' })
const canvasRootRef = useTemplateRef<HTMLDivElement>('canvasRoot')
const moveableRef = useTemplateRef('moveable')
const stageRef = useTemplateRef('stage')

const {
  height: viewportHeight,
  width: viewportWidth,
  measured: viewportMeasured,
} = useCanvasViewport(canvasRootRef)
useCanvasShortcutFocus(canvasRootRef)
const { canvas, nodes, selectedNodeIds } = storeToRefs(editorStore)
const { resolvedMode, rootStyle: renderThemeStyle, resolveColor } = useRenderTheme()

const {
  isMoveableActive,
  moveableBounds,
  onDrag,
  onStart,
  onEnd,
  onResize,
  onDragGroup,
  onResizeGroup,
} = useMoveable()
const { canvasWidth, canvasHeight, canvasStyle, scale, lines, palette, onZoomChange } =
  useCanvasRuler({
    moveableRef,
    isMoveableActive,
  })
const { isCanvasPanning, fitCanvas, centerCanvas, setCanvasScale, isCanvasFit } = useCanvasZoom({
  viewportWidth,
  viewportHeight,
  viewportMeasured,
  canvasWidth,
  canvasHeight,
  scale,
})
const { selectedTarget, onSelect, onClearSelected, onSelectEnd } = useSelection({
  stageRef,
  moveableRef,
  isMoveableActive,
})
const {
  contextMenuTarget,
  contextMenuNodes,
  contextMenuAnchor,
  onContextMenu,
  closeContextMenu,
  onContextMenuCommand,
} = useCanvasContextMenu({ canvasRootRef, stageRef, scale })

function onStageMouseDown(event: MouseEvent) {
  if (event.target === stageRef.value && !isCanvasPanning.value) onClearSelected()
}

function onNodeMouseDown(node: MaterialSchema, event: MouseEvent) {
  if (event.button !== 0 || isCanvasPanning.value) return
  if (node.lockKey) {
    onClearSelected()
    return
  }
  onSelect(node, event)
}

const onCanvasMouseDown = dispatchEventHandlers(onStageMouseDown, closeContextMenu)
const onCanvasZoom = dispatchEventHandlers(onZoomChange, closeContextMenu)

function onDrop(e: DragEvent) {
  const data = e.dataTransfer.getData('schema')
  const node = createNode(JSON.parse(data))

  const v = e.currentTarget as HTMLDivElement
  const rect = v.getBoundingClientRect()

  const x = (e.clientX - rect.left) / scale.value - node.layout.width / 2
  const y = (e.clientY - rect.top) / scale.value - node.layout.height / 2
  node.layout.x = Math.min(Math.max(x, 0), Math.max(canvasWidth.value - node.layout.width, 0))
  node.layout.y = Math.min(Math.max(y, 0), Math.max(canvasHeight.value - node.layout.height, 0))
  editorStore.addNode(node)
  editorStore.selectNode(node.id)
}

function getNodeStyle(node: MaterialSchema, index: number) {
  return {
    width: node.layout.width + 'px',
    height: node.layout.height + 'px',
    left: node.layout.x + 'px',
    top: node.layout.y + 'px',
    zIndex: index + 1,
  }
}

const stageStyle = computed(() => ({
  ...canvasStyle.value,
  ...renderThemeStyle.value,
  backgroundColor: resolveColor(canvas.value.backgroundColor),
}))
</script>

<template>
  <div
    class="canvas-root"
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
      @zoomchange="onCanvasZoom"
    >
      <template #default>
        <div
          ref="stage"
          class="canvas-stage"
          :data-render-theme="resolvedMode"
          :style="stageStyle"
          @dragover.prevent
          @drop="onDrop"
        >
          <div
            v-for="(node, index) in nodes"
            :key="node.id"
            class="canvas-node"
            :class="{ 'is-locked': node.lockKey }"
            :style="getNodeStyle(node, index)"
            :data-node-id="node.id"
            @mousedown="(event) => onNodeMouseDown(node, event)"
          >
            <component :is="getMaterialComponent(node.type)" :schema="node" />
          </div>
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
      ref="contextMenu"
      trigger="contextmenu"
      virtual-triggering
      :virtual-ref="contextMenuAnchor"
      :show-arrow="false"
      placement="bottom-start"
      popper-class="node-context-menu-popper"
      @command="onContextMenuCommand"
    >
      <template v-if="contextMenuTarget" #dropdown>
        <CanvasContextMenu v-if="contextMenuTarget.kind === 'canvas'" />
        <NodeContextMenu v-else :nodes="contextMenuNodes" :target-kind="contextMenuTarget.kind" />
      </template>
    </el-dropdown>
    <Selecto
      v-if="stageRef && !isCanvasPanning"
      :container="stageRef"
      :dragContainer="stageRef"
      :selectableTargets="['.canvas-node:not(.is-locked)']"
      :selectFromInside="false"
      :toggleContinueSelect="'shift'"
      @selectEnd="onSelectEnd"
    ></Selecto>
    <Moveable
      v-if="selectedNodeIds.length && selectedTarget.length"
      ref="moveable"
      :target="selectedTarget"
      :draggable="!isCanvasPanning"
      :resizable="true"
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

    .canvas-node {
      position: absolute;
    }
  }

  .canvas-zoom {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 10;
  }
}
</style>
