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

defineOptions({
  name: 'CanvasRoot',
})
const editorStore = useEditorStore()
const moveableRef = useTemplateRef('moveable')
const stageRef = useTemplateRef('stage')
const canvasRootRef = useTemplateRef('canvasRoot')

const { height: rectHeight, width: rectWidth } = useRefResizeObserver(canvasRootRef)
const { nodes } = storeToRefs(editorStore)

const { active: dragCanvas } = useSpaceEventListener()
const { canvasWidth, canvasHeight, canvasStyle, scale, lines, palette, onZoomChange } =
  useCanvasRuler({
    moveableRef,
  })
const { onDrag, onStart, onEnd, onResize, onDragGroup, onResizeGroup } = useMoveable({
  moveableRef,
})
const { selectedTarget, onSelect, onClearSelected, onSelectEnd } = useSelection({
  stageRef,
  moveableRef,
})

function onDrop(e: DragEvent) {
  const data = e.dataTransfer.getData('schema')
  const node = createNode(JSON.parse(data))
  node.layout.x = e.offsetX - node.layout.width / 2
  node.layout.y = e.offsetY - node.layout.height / 2
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

const commandMap = {
  copy: () => editorStore.copyNode(editorStore.selectedNode),
  remove: () => editorStore.removeNode(editorStore.selectedNode),
  moveTop: () => editorStore.moveBottom(editorStore.selectedNode),
  moveBottom: () => editorStore.moveTop(editorStore.selectedNode),
  toggleLock: () => {
    editorStore.toggleLock(editorStore.selectedNode)
    selectedTarget.value = []
  },
}

function onCommand(command: string) {
  commandMap[command]()
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
        @mousedown.self="onClearSelected"
      >
        <el-dropdown
          trigger="contextmenu"
          v-for="(node, index) in nodes"
          :key="node.id"
          @command="onCommand"
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
            <el-dropdown-item command="copy">复制</el-dropdown-item>
            <el-dropdown-item command="remove">移除</el-dropdown-item>
            <el-dropdown-item command="moveTop">置顶</el-dropdown-item>
            <el-dropdown-item command="moveBottom">置底</el-dropdown-item>
            <el-dropdown-item command="toggleLock">
              {{ node.locked ? '解锁' : '锁定' }}
            </el-dropdown-item>
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
      :draggable="true"
      :resizable="true"
      :origin="false"
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
  .canvas-stage {
    position: relative;
    .canvas-node {
      position: absolute;
    }
  }
}
</style>
