<script setup lang="ts">
import { createNode, getMaterialComponent } from '@/materials'
import Selecto from 'vue3-selecto'
import Moveable from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { useSpaceEventListener } from '@/hooks/useSpaceEventListener.ts'
import type { MaterialSchema } from '@/schema/material.ts'
import SketchRuler from 'vue3-sketch-ruler'
import 'vue3-sketch-ruler/lib/style.css'
import { useCanvasRuler } from '@/editor/canvas/composables/useCanvasRuler.ts'
import { useCanvasZoom } from '@/editor/canvas/composables/useCanvasZoom.ts'
import { useMoveable } from '@/editor/canvas/composables/useMoveable.ts'
import { useSelection } from '@/editor/canvas/composables/useSelection.ts'
import NodeContextMenu from '@/editor/canvas/components/NodeContextMenu.vue'
import CanvasZoomControl from '@/editor/canvas/components/CanvasZoomControl.vue'
import { dispatchEventHandlers } from '@/utils/dispatchEventHandlers.ts'
import { useNodeContextMenu } from '@/editor/canvas/composables/useNodeContextMenu.ts'
import { useCanvasViewport } from '@/editor/canvas/composables/useCanvasViewport.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'

defineOptions({
  name: 'CanvasRoot',
})
const editorStore = useEditorStore()
const moveableRef = useTemplateRef('moveable')
const stageRef = useTemplateRef('stage')

const { height: viewportHeight, width: viewportWidth } = useCanvasViewport()
const { canvas, nodes } = storeToRefs(editorStore)
const { resolvedMode, rootStyle: renderThemeStyle, resolveColor } = useRenderTheme()

const { active: dragCanvas } = useSpaceEventListener()
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
const { fitCanvas, centerCanvas, setCanvasScale, isCanvasFit } = useCanvasZoom({
  viewportWidth,
  viewportHeight,
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
  contextMenuNode,
  contextMenuAnchor,
  openContextMenu,
  closeContextMenu,
  onContextMenuCommand,
} = useNodeContextMenu({
  onNodeLockChange: () => {
    selectedTarget.value = []
  },
})

function onStageMouseDown(event: MouseEvent) {
  if (event.target === stageRef.value && !dragCanvas.value) onClearSelected()
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
  <div class="canvas-root" ref="canvasRoot" @mousedown.capture="onCanvasMouseDown">
    <SketchRuler
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
            :style="getNodeStyle(node, index)"
            :data-node-id="node.id"
            :data-node-locked="node.locked"
            @mousedown="(e) => onSelect(node, e)"
            @contextmenu.prevent.stop="(e) => openContextMenu(node, e)"
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
      <template v-if="contextMenuNode" #dropdown>
        <NodeContextMenu :node="contextMenuNode" />
      </template>
    </el-dropdown>
    <Selecto
      v-if="stageRef && !dragCanvas"
      :container="stageRef"
      :dragContainer="stageRef"
      :selectableTargets="['.canvas-node']"
      :selectFromInside="false"
      :toggleContinueSelect="'shift'"
      @selectEnd="onSelectEnd"
    ></Selecto>
    <Moveable
      ref="moveable"
      :target="selectedTarget"
      :draggable="!dragCanvas"
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
