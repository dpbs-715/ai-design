<script setup lang="ts">
import type { MaterialSchema } from '@/materials/types.ts'
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

defineOptions({
  name: 'CanvasRoot',
})

const moveableRef = useTemplateRef('moveable')
const stageRef = useTemplateRef('stage')
const canvasRootRef = useTemplateRef('canvasRoot')

const { height: rectHeight, width: rectWidth } = useRefResizeObserver(canvasRootRef)

const canvasWidth = ref(1920)
const canvasHeight = ref(1080)
const editorStore = useEditorStore()

const canvasStyle = computed(() => {
  return {
    width: canvasWidth.value + 'px',
    height: canvasHeight.value + 'px',
  }
})

const { active: dragCanvas } = useSpaceEventListener()

const { nodes } = storeToRefs(editorStore)

const selectedTarget = shallowRef<HTMLElement>()

const vm = getCurrentInstance()

function onDrop(e: DragEvent) {
  const data = e.dataTransfer.getData('schema')
  const node = createNode(JSON.parse(data))
  node.layout.x = e.offsetX - node.layout.width / 2
  node.layout.y = e.offsetY - node.layout.height / 2
  editorStore.addNode(node)
  editorStore.selectNode(node.id)
  nextTick(() => {
    selectedTarget.value = vm.proxy.$el.querySelector(`[data-node-id='${node.id}']`)
  })
}

function getNodeStyle(node: MaterialSchema) {
  return {
    width: node.layout.width + 'px',
    height: node.layout.height + 'px',
    left: node.layout.x + 'px',
    top: node.layout.y + 'px',
  }
}

function onSelect(node: MaterialSchema, e: MouseEvent) {
  selectedTarget.value = e.currentTarget as HTMLElement
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
  selectedTarget.value = null
}

function onSelectEnd(e) {
  selectedTarget.value = e.selected
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
        <div
          class="canvas-node"
          v-for="node in nodes"
          :key="node.id"
          :style="getNodeStyle(node)"
          :data-node-id="node.id"
          @mousedown="(e) => onSelect(node, e)"
        >
          <component :is="getMaterialComponent(node.type)" :schema="node" />
        </div>
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
    background: bg-mix(40);
    position: relative;
    .canvas-node {
      position: absolute;
    }
  }
}
</style>
