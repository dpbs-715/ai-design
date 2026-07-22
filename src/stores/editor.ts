import { defineStore } from 'pinia'

import type { MaterialSchema } from '@/schema/material.ts'
import type { PageSchema } from '@/schema/page.ts'
import { deepClone } from '@vunio/utils'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { SetFormFieldCommand } from '@vunio/ui'
import {
  createDefaultRenderTheme,
  createThemeColorReference,
  normalizeRenderTheme,
} from '@/theme/renderTheme.ts'

export const useEditorStore = defineStore('editor', () => {
  const { dispatchCommand } = useUndoRedo()

  const page = ref<PageSchema>({
    theme: createDefaultRenderTheme(),
    canvas: {
      width: 1920,
      height: 1080,
      backgroundColor: createThemeColorReference('page-background'),
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
      {
        type: 'api',
        id: '789',
        name: '上升趋势',
        url: '/api/data',
        method: 'get',
        // interval: 2000,
        params: {
          date: '2026-10-10',
        },
        data: [],
      },
    ],
  })

  const canvas = toRef(page.value, 'canvas')
  const theme = toRef(page.value, 'theme')
  const nodes = toRef(page.value, 'nodes')
  const dataSources = toRef(page.value, 'dataSources')

  function setPage(newPage: PageSchema) {
    Object.assign(page.value, newPage, {
      theme: normalizeRenderTheme(newPage.theme),
    })
  }

  const nodeMap = computed(() => new Map(nodes.value.map((node) => [node.id, node])))

  const selectedNodeIds = ref<string[]>([])

  watch(
    nodes,
    (currentNodes) => {
      const selectableNodeIds = new Set(
        currentNodes.filter((node) => !node.lockKey).map((node) => node.id),
      )
      selectedNodeIds.value = selectedNodeIds.value.filter((id) => selectableNodeIds.has(id))
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

  function setNodes(newNodes: MaterialSchema[]) {
    dispatchCommand(
      new SetFormFieldCommand(getPageData, 'nodes', newNodes, {
        clone: 'shallow',
      }),
    )
  }

  function findNode(id: string | null | undefined) {
    return id ? nodeMap.value.get(id) : undefined
  }

  function requireNode(id: string) {
    const node = findNode(id)
    if (!node) throw new Error(`Node ${id} not found`)
    return node
  }

  function getNodesByIds(ids: string[]) {
    const nodeIds = new Set(ids)
    return nodes.value.filter((node) => nodeIds.has(node.id))
  }

  function findNodesByLockKey(lockKey: string) {
    return nodes.value.filter((node) => node.lockKey === lockKey)
  }

  function addNode(node: MaterialSchema) {
    setNodes([...nodes.value, node])
  }

  function selectNode(id: string) {
    const node = findNode(id)
    if (!node || node.lockKey) {
      clearSelection()
      return
    }
    selectedNodeIds.value = [id]
  }

  function isNodeSelected(id: string) {
    return selectedNodeIds.value.includes(id)
  }

  function clearSelection() {
    selectedNodeIds.value = []
  }

  function selectNodes(ids: string[]) {
    selectedNodeIds.value = [...new Set(ids)].filter((id) => {
      const node = findNode(id)
      return node && !node.lockKey
    })
  }

  function copyNodes(ids: string[]) {
    const copies = getNodesByIds(ids)
      .filter((node) => !node.lockKey)
      .map((node) => {
        const copy = deepClone(node)
        copy.id = crypto.randomUUID()
        copy.layout.x += 20
        copy.layout.y += 20
        return copy
      })
    if (!copies.length) return

    setNodes([...nodes.value, ...copies])
    selectNodes(copies.map((node) => node.id))
  }

  function removeNodes(ids: string[]) {
    const selectedNodes = getNodesByIds(ids)
    if (!selectedNodes.length) return

    const selectedIds = new Set(selectedNodes.map((node) => node.id))
    const remainingNodes = nodes.value.filter((node) => !selectedIds.has(node.id))
    setNodes(remainingNodes)
  }

  function reorderNodes(ids: string[], position: 'front' | 'back') {
    const selectedNodes = getNodesByIds(ids)
    if (!selectedNodes.length || selectedNodes.some((node) => node.lockKey)) return

    const selectedIds = new Set(selectedNodes.map((node) => node.id))
    const remainingNodes = nodes.value.filter((node) => !selectedIds.has(node.id))
    const reorderedNodes =
      position === 'front'
        ? [...remainingNodes, ...selectedNodes]
        : [...selectedNodes, ...remainingNodes]
    if (reorderedNodes.every((node, index) => node === nodes.value[index])) return
    setNodes(reorderedNodes)
  }

  function moveNodesToFront(ids: string[]) {
    reorderNodes(ids, 'front')
  }

  function moveNodesToBack(ids: string[]) {
    reorderNodes(ids, 'back')
  }

  function lockNodes(ids: string[]) {
    const lockableNodes = getNodesByIds(ids).filter((node) => !node.lockKey)
    if (!lockableNodes.length) return

    const lockKey = crypto.randomUUID()
    const lockableIds = new Set(lockableNodes.map((node) => node.id))
    const newNodes = nodes.value.map((node) =>
      lockableIds.has(node.id) ? { ...node, lockKey } : node,
    )
    setNodes(newNodes)
  }

  function unlockNodes(ids: string[]) {
    const lockKeys = new Set(
      getNodesByIds(ids).flatMap((node) => (node.lockKey ? [node.lockKey] : [])),
    )
    if (!lockKeys.size) return

    setNodes(
      nodes.value.map((node) =>
        node.lockKey && lockKeys.has(node.lockKey) ? { ...node, lockKey: undefined } : node,
      ),
    )
  }

  function updateNode(id: string, newNode: MaterialSchema) {
    const newNodes = nodes.value.map((node) => (node.id === id ? newNode : node))
    setNodes(newNodes)
  }

  return {
    page,
    nodes,
    canvas,
    theme,
    dataSources,
    selectedNodeId,
    selectedNodeIds,
    selectedNode,
    addNode,
    selectNode,
    isNodeSelected,
    clearSelection,
    selectNodes,
    findNode,
    findNodesByLockKey,
    requireNode,
    copyNodes,
    removeNodes,
    moveNodesToFront,
    moveNodesToBack,
    lockNodes,
    unlockNodes,
    updateNode,
    setPage,
  }
})
