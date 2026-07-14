<script setup lang="ts">
import { createNode, getMaterialComponent } from '@/materials'
import Selecto from 'vue3-selecto'
import Moveable from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { useSpaceEventListener } from '@/hooks/useSpaceEventListener.ts'
import { useRefResizeObserver } from '@/hooks/useRefResizeObserver.ts'
import type { MaterialSchema } from '@/schema/material.ts'
import SketchRuler from 'vue3-sketch-ruler'
import 'vue3-sketch-ruler/lib/style.css'
import { useCanvasRuler } from '@/editor/canvas/composables/useCanvasRuler.ts'
import { useMoveable } from '@/editor/canvas/composables/useMoveable.ts'
import { useSelection } from '@/editor/canvas/composables/useSelection.ts'
import NodeContextMenu from '@/editor/canvas/components/NodeContextMenu.vue'
import type { NodeContextMenuCommand } from '@/editor/canvas/contextMenu.ts'
import type { DropdownInstance } from 'element-plus'

defineOptions({
  name: 'CanvasRoot',
})
const editorStore = useEditorStore()
const moveableRef = useTemplateRef('moveable')
const stageRef = useTemplateRef('stage')
const canvasRootRef = useTemplateRef('canvasRoot')
const dropdownRefs = new Map<string, DropdownInstance>()
let activeContextMenuId: string | null = null

const { height: rectHeight, width: rectWidth } = useRefResizeObserver(canvasRootRef)
const { nodes } = storeToRefs(editorStore)

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
const { selectedTarget, onSelect, onClearSelected, onSelectEnd } = useSelection({
  stageRef,
  moveableRef,
  isMoveableActive,
})

function onStageMouseDown() {
  if (!dragCanvas.value) onClearSelected()
}

function setDropdownRef(nodeId: string, dropdown: DropdownInstance | null) {
  if (dropdown) {
    dropdownRefs.set(nodeId, dropdown)
    return
  }

  dropdownRefs.delete(nodeId)
  if (activeContextMenuId === nodeId) activeContextMenuId = null
}

function onContextMenuVisibleChange(nodeId: string, visible: boolean) {
  if (!visible) {
    if (activeContextMenuId === nodeId) activeContextMenuId = null
    return
  }

  if (activeContextMenuId && activeContextMenuId !== nodeId) {
    dropdownRefs.get(activeContextMenuId)?.handleClose()
  }
  activeContextMenuId = nodeId
}

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

const commandMap: Record<NodeContextMenuCommand, (node: MaterialSchema) => void> = {
  copy: (node) => editorStore.copyNode(node),
  remove: (node) => editorStore.removeNode(node),
  moveTop: (node) => editorStore.moveBottom(node),
  moveBottom: (node) => editorStore.moveTop(node),
  toggleLock: (node) => {
    editorStore.toggleLock(node)
    selectedTarget.value = []
  },
}

function onCommand(command: NodeContextMenuCommand, node: MaterialSchema) {
  commandMap[command](node)
}
</script>

<template>
  <div class="canvas-root" ref="canvasRoot">
    <SketchRuler
      v-model:scale="scale"
      :palette="palette"
      :width="rectWidth"
      :height="rectHeight"
      :canvasWidth="canvasWidth"
      :canvasHeight="canvasHeight"
      :thick="20"
      :lines="lines"
      :enable-animation="true"
      animation-mode="ease-out"
      @zoomchange="onZoomChange"
    >
      <div
        ref="stage"
        class="canvas-stage"
        :style="canvasStyle"
        @dragover.prevent
        @drop="onDrop"
        @mousedown.self="onStageMouseDown"
      >
        <el-dropdown
          v-for="(node, index) in nodes"
          :key="node.id"
          :ref="(dropdown: DropdownInstance | null) => setDropdownRef(node.id, dropdown)"
          trigger="contextmenu"
          :show-arrow="false"
          popper-class="node-context-menu-popper"
          @command="(command: NodeContextMenuCommand) => onCommand(command, node)"
          @visible-change="(visible: boolean) => onContextMenuVisibleChange(node.id, visible)"
        >
          <div
            class="canvas-node"
            :style="getNodeStyle(node, index)"
            :data-node-id="node.id"
            :data-node-locked="node.locked"
            @mousedown="(e) => onSelect(node, e)"
          >
            <component :is="getMaterialComponent(node.type)" :schema="node" />
          </div>
          <template #dropdown>
            <NodeContextMenu :node="node" />
          </template>
        </el-dropdown>
      </div>
    </SketchRuler>
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
    box-shadow: 0 12px 36px rgb(0 0 0 / 34%);

    .canvas-node {
      position: absolute;
    }
  }
}
</style>
