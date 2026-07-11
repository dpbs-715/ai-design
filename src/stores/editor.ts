import { defineStore } from 'pinia'

import type { MaterialSchema } from '@/schema/material.ts'
import type { PageSchema } from '@/schema/page.ts'
import { deepClone } from '@vunio/utils'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { SetFormFieldCommand } from '@vunio/ui'

export const useEditorStore = defineStore('editor', () => {
  const { dispatchCommand } = useUndoRedo()

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
    dataSources: [
      {
        type: 'static',
        id: '123',
        name: '销售数据',
        data: [
          {
            label: 'label1',
            value: 100,
          },
          {
            label: 'label2',
            value: 200,
          },
          {
            label: 'label3',
            value: 300,
          },
        ],
      },
      {
        type: 'static',
        id: '456',
        name: '访问数据',
        data: [
          {
            label: '1label1',
            value: 1001,
          },
          {
            label: '2label2',
            value: 2002,
          },
          {
            label: '3label3',
            value: 3003,
          },
        ],
      },
    ],
  })

  const canvas = toRef(page.value, 'canvas')
  const nodes = toRef(page.value, 'nodes')
  const dataSources = toRef(page.value, 'dataSources')

  function setPage(newPage: PageSchema) {
    Object.assign(page.value, newPage)
  }

  const nodeMap = computed(() => new Map(nodes.value.map((node) => [node.id, node])))

  const selectedNodeIds = ref<string[]>([])

  watch(
    nodes,
    (currentNodes) => {
      const nodeIds = new Set(currentNodes.map((node) => node.id))
      selectedNodeIds.value = selectedNodeIds.value.filter((id) => nodeIds.has(id))
    },
    { flush: 'sync' },
  )

  const selectedNodeId = computed(() => {
    return selectedNodeIds.value.length === 1 ? selectedNodeIds.value[0] : null
  })

  const selectedNode = computed(() => {
    const id = selectedNodeId.value
    return id ? nodeMap.value.get(id) : undefined
  })

  const getPageData = () => page.value
  function setNodes(newNodes) {
    dispatchCommand(
      new SetFormFieldCommand(getPageData, 'nodes', newNodes, {
        clone: 'shallow',
      }),
    )
  }

  function addNode(node: MaterialSchema) {
    setNodes([...nodes.value, node])
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

  function findNode(id: string | null | undefined) {
    return id ? nodeMap.value.get(id) : undefined
  }

  function requireNode(id: string) {
    const node = findNode(id)
    if (!node) throw new Error(`Node ${id} not found`)
    return node
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
    setNodes(nodes.value.filter((n) => n.id !== node.id))
    selectedNodeIds.value = selectedNodeIds.value.filter((id) => id !== node.id)
  }
  function moveTop(node: MaterialSchema) {
    const index = nodes.value.findIndex((n) => n.id === node.id)
    const splicedNodes = nodes.value.toSpliced(index, 1)
    setNodes([node, ...splicedNodes])
  }
  function moveBottom(node: MaterialSchema) {
    const index = nodes.value.findIndex((n) => n.id === node.id)
    const splicedNodes = nodes.value.toSpliced(index, 1)
    setNodes([...splicedNodes, node])
  }
  function toggleLock(node: MaterialSchema) {
    dispatchCommand(new SetFormFieldCommand(() => node, 'locked', !node.locked))
  }

  function updateNode(id, newNode) {
    const newNodes = nodes.value.map((node) => (node.id === id ? newNode : node))
    setNodes(newNodes)
  }

  return {
    panelVisible,
    page,
    nodes,
    canvas,
    dataSources,
    selectedNodeId,
    selectedNodeIds,
    selectedNode,
    addNode,
    selectNode,
    clearSelectedNode,
    selectNodes,
    findNode,
    requireNode,
    copyNode,
    removeNode,
    moveTop,
    moveBottom,
    toggleLock,
    updateNode,
    setPage,
  }
})
