<script setup lang="ts">
import { createNode, getMaterialComponent } from '@/materials'
import Moveable, {
  type OnDrag,
  type OnDragGroup,
  type OnResize,
  type OnResizeGroup,
} from 'vue3-moveable'
import Selecto from 'vue3-selecto'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import Ruler from '@/editor/canvas/Ruler.vue'
import { useSpaceEventListener } from '@/hooks/useSpaceEventListener.ts'
import { useRefResizeObserver } from '@/hooks/useRefResizeObserver.ts'
import type { MaterialSchema } from '@/schema/material.ts'

defineOptions({
  name: 'CanvasRoot',
})
const editorStore = useEditorStore()
const moveableRef = useTemplateRef('moveable')
const stageRef = useTemplateRef('stage')
const canvasRootRef = useTemplateRef('canvasRoot')

const { height: rectHeight, width: rectWidth } = useRefResizeObserver(canvasRootRef)
const { nodes, selectedNodeIds, canvas } = storeToRefs(editorStore)
const { active: dragCanvas } = useSpaceEventListener()

const canvasWidth = toRef(canvas.value, 'width')
const canvasHeight = toRef(canvas.value, 'height')

const selectedTarget = shallowRef<HTMLElement[]>()

const canvasStyle = computed(() => {
  return {
    width: canvasWidth.value + 'px',
    height: canvasHeight.value + 'px',
    backgroundColor: canvas.value.backgroundColor,
  }
})

function getNodeStyle(node: MaterialSchema, index: number) {
  return {
    width: node.layout.width + 'px',
    height: node.layout.height + 'px',
    left: node.layout.x + 'px',
    top: node.layout.y + 'px',
    zIndex: index + 1,
  }
}

function onDrop(e: DragEvent) {
  const data = e.dataTransfer.getData('schema')
  const node = createNode(JSON.parse(data))
  node.layout.x = e.offsetX - node.layout.width / 2
  node.layout.y = e.offsetY - node.layout.height / 2
  editorStore.addNode(node)
  editorStore.selectNode(node.id)
}

function onSelect(node: MaterialSchema, e: MouseEvent) {
  editorStore.selectNode(node.id)

  nextTick(() => {
    moveableRef.value.dragStart(e)
  })
}

function getNodeByTarget(element: HTMLElement) {
  const id = element.getAttribute('data-node-id')
  return editorStore.findNode(id)
}

function onDrag(e: OnDrag) {
  e.target.style.left = e.left + 'px'
  e.target.style.top = e.top + 'px'
  const node = getNodeByTarget(e.target as HTMLElement)
  node.layout.x = e.left
  node.layout.y = e.top
}
function onResize(e: OnResize) {
  e.target.style.width = e.width + 'px'
  e.target.style.height = e.height + 'px'
  const node = getNodeByTarget(e.target as HTMLElement)
  node.layout.width = e.width
  node.layout.height = e.height
  onDrag(e.drag)
}

function onClearSelected() {
  editorStore.clearSelectedNode()
}

function onSelectEnd(e) {
  const ids = e.selected.map((element) => element.getAttribute('data-node-id'))
  editorStore.selectNodes(ids)
}

function onDragGroup(e: OnDragGroup) {
  e.events.forEach((event) => {
    onDrag(event)
  })
}
function onResizeGroup(e: OnResizeGroup) {
  e.events.forEach((event) => {
    onResize(event)
  })
}
const handleZoomChange = () => {
  moveableRef.value.updateRect()
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

watch(
  selectedNodeIds,
  (ids) => {
    selectedTarget.value = ids.map((id) => {
      return stageRef.value.querySelector(`[data-node-id='${id}']:not([data-node-locked='true'])`)
    })
  },
  {
    deep: true,
    flush: 'post',
  },
)
</script>

<template>
  <div class="canvas-root" ref="canvasRoot">
    <Ruler
      @zoomchange="handleZoomChange"
      :width="rectWidth"
      :height="rectHeight"
      :canvasWidth="canvasWidth"
      :canvasHeight="canvasHeight"
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
    </Ruler>
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
      @resize="onResize"
      @dragGroup="onDragGroup"
      @resizeGroup="onResizeGroup"
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
