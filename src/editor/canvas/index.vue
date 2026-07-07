<script setup lang="ts">
import type { MaterialSchema } from '@/materials/types.ts'
import { createNode, getMaterialComponent } from '@/materials'
import Moveable, { type OnDrag, type OnResize } from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
defineOptions({
  name: 'CanvasRoot',
})

const moveableRef = useTemplateRef('moveable')

const editorStore = useEditorStore()
const { nodes, selectedNode } = storeToRefs(editorStore)

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

function onDrag(e: OnDrag) {
  selectedTarget.value.style.left = e.left + 'px'
  selectedTarget.value.style.top = e.top + 'px'
  selectedNode.value.layout.x = e.left
  selectedNode.value.layout.y = e.top
}
function onResize(e: OnResize) {
  selectedTarget.value.style.width = e.width + 'px'
  selectedTarget.value.style.height = e.height + 'px'
  selectedNode.value.layout.width = e.width
  selectedNode.value.layout.height = e.height

  onDrag(e.drag)
}

function onClearSelected() {
  editorStore.clearSelectedNode()
  selectedTarget.value = null
}
</script>

<template>
  <div class="canvas-root">
    <div class="canvas-stage" @dragover.prevent @drop="onDrop" @mousedown.self="onClearSelected">
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
    <Moveable
      ref="moveable"
      :target="selectedTarget"
      :draggable="true"
      :resizable="true"
      @resize="onResize"
      :origin="false"
      @drag="onDrag"
    ></Moveable>
  </div>
</template>

<style scoped lang="scss">
.canvas-root {
  .canvas-stage {
    width: 600px;
    height: 600px;
    background: bg-mix(40);
    margin: 100px;
    position: relative;
    .canvas-node {
      position: absolute;
    }
  }
}
</style>
