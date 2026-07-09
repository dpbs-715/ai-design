import { defineStore } from 'pinia'

import type { MaterialSchema } from '@/schema/material.ts'
import type { PageSchema } from '@/schema/page.ts'
import { deepClone } from '@vunio/utils'

export const useEditorStore = defineStore('editor', () => {
  const panelVisible = reactive({
    material: true,
    layer: true,
    property: true,
  })

  const page = ref<PageSchema>({
    canvas: {
      width: 1920,
      height: 1080,
      backgroundColor: '#0d121b',
    },
    nodes: [],
  })

  const canvas = toRef(page.value, 'canvas')

  const nodes = toRef(page.value, 'nodes')

  const selectedNodeIds = ref<string[]>([])

  const selectedNodeId = computed(() => {
    return selectedNodeIds.value.length === 1 ? selectedNodeIds.value[0] : null
  })

  const selectedNode = computed(() => {
    return nodes.value.find((node) => node.id === selectedNodeId.value)
  })

  function addNode(node: MaterialSchema) {
    nodes.value.push(node)
  }
  function selectNode(id: string) {
    selectedNodeIds.value = [id]
  }

  function clearSelectedNode() {
    selectedNodeIds.value = []
  }

  function selectNodes(ids: string[]) {
    selectedNodeIds.value = ids
  }

  function findNode(id: string) {
    return nodes.value.find((node) => node.id === id)
  }

  function copyNode(node: MaterialSchema) {
    const newNode = deepClone(node)
    newNode.id = crypto.randomUUID()
    newNode.layout.x += 20
    newNode.layout.y += 20
    addNode(newNode)
    selectNode(newNode.id)
  }
  function removeNode(node: MaterialSchema) {
    nodes.value = nodes.value.filter((n) => n.id !== node.id)
    selectedNodeIds.value = selectedNodeIds.value.filter((id) => id !== node.id)
  }
  function moveTop(node: MaterialSchema) {
    const index = nodes.value.findIndex((n) => n.id === node.id)
    nodes.value.splice(index, 1)
    nodes.value.unshift(node)
  }
  function moveBottom(node: MaterialSchema) {
    const index = nodes.value.findIndex((n) => n.id === node.id)
    nodes.value.splice(index, 1)
    nodes.value.push(node)
  }
  function toggleLock(node: MaterialSchema) {
    node.locked = !node.locked
  }

  return {
    panelVisible,
    nodes,
    canvas,
    page,
    selectedNodeId,
    selectedNodeIds,
    selectedNode,
    addNode,
    selectNode,
    clearSelectedNode,
    selectNodes,
    findNode,

    copyNode,
    removeNode,
    moveTop,
    moveBottom,
    toggleLock,
  }
})
