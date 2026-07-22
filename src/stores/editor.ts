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

export type NodePastePlacement =
  | { kind: 'preserve' }
  | { kind: 'offset'; x: number; y: number }
  | { kind: 'cascade'; x: number; y: number }
  | { kind: 'point'; point: { x: number; y: number } }

export const useEditorStore = defineStore('editor', () => {
  const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()

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

  function dispatchCommandBatch(callback: () => void) {
    startBatch()
    try {
      callback()
    } finally {
      commitBatch()
    }
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

  function selectAllNodes() {
    selectNodes(nodes.value.map((node) => node.id))
  }

  function getBoundedNodeTranslation(sourceNodes: MaterialSchema[], placement: NodePastePlacement) {
    if (!sourceNodes.length) return { x: 0, y: 0 }

    const minX = Math.min(...sourceNodes.map((node) => node.layout.x))
    const minY = Math.min(...sourceNodes.map((node) => node.layout.y))
    const maxX = Math.max(...sourceNodes.map((node) => node.layout.x + node.layout.width))
    const maxY = Math.max(...sourceNodes.map((node) => node.layout.y + node.layout.height))
    const groupWidth = maxX - minX
    const groupHeight = maxY - minY
    const maxLeft = Math.max(canvas.value.width - groupWidth, 0)
    const maxTop = Math.max(canvas.value.height - groupHeight, 0)

    function getCascadePosition(position: number, offset: number, maxPosition: number) {
      const forwardPosition = position + offset
      if (forwardPosition >= 0 && forwardPosition <= maxPosition) return forwardPosition

      const backwardPosition = position - offset
      if (backwardPosition >= 0 && backwardPosition <= maxPosition) return backwardPosition

      return Math.min(Math.max(forwardPosition, 0), maxPosition)
    }

    let desiredLeft = minX
    let desiredTop = minY
    if (placement.kind === 'offset') {
      desiredLeft += placement.x
      desiredTop += placement.y
    } else if (placement.kind === 'cascade') {
      desiredLeft = getCascadePosition(minX, placement.x, maxLeft)
      desiredTop = getCascadePosition(minY, placement.y, maxTop)
    } else if (placement.kind === 'point') {
      desiredLeft = placement.point.x - groupWidth / 2
      desiredTop = placement.point.y - groupHeight / 2
    }

    const left = Math.min(Math.max(desiredLeft, 0), maxLeft)
    const top = Math.min(Math.max(desiredTop, 0), maxTop)

    return { x: left - minX, y: top - minY }
  }

  function duplicateNodes(ids: string[]) {
    const sourceNodes = getNodesByIds(ids).filter((node) => !node.lockKey)
    const translation = getBoundedNodeTranslation(sourceNodes, { kind: 'cascade', x: 20, y: 20 })
    const copies = sourceNodes.map((node) => {
      const copy = deepClone(node)
      copy.id = crypto.randomUUID()
      copy.layout.x += translation.x
      copy.layout.y += translation.y
      return copy
    })
    if (!copies.length) return

    setNodes([...nodes.value, ...copies])
    selectNodes(copies.map((node) => node.id))
  }

  function pasteNodes(sourceNodes: MaterialSchema[], placement: NodePastePlacement) {
    if (!sourceNodes.length) return 0

    const translation = getBoundedNodeTranslation(sourceNodes, placement)

    const pastedNodes = sourceNodes.map((sourceNode) => {
      const node = deepClone(sourceNode)
      node.id = crypto.randomUUID()
      node.lockKey = undefined
      node.layout.x += translation.x
      node.layout.y += translation.y
      return node
    })

    dispatchCommandBatch(() => {
      setNodes([...nodes.value, ...pastedNodes])
    })
    selectNodes(pastedNodes.map((node) => node.id))
    return pastedNodes.length
  }

  function mergePage(sourcePage: PageSchema) {
    const usedDataSourceIds = new Set(dataSources.value.map((source) => source.id))
    const dataSourceIdMap = new Map<string, string>()
    const mergedDataSources = sourcePage.dataSources.map((source) => {
      const clonedSource = deepClone(source)
      let nextId = source.id
      while (usedDataSourceIds.has(nextId)) nextId = crypto.randomUUID()
      usedDataSourceIds.add(nextId)
      dataSourceIdMap.set(source.id, nextId)
      clonedSource.id = nextId
      return clonedSource
    })

    const mergedNodes = sourcePage.nodes.map((sourceNode) => {
      const node = deepClone(sourceNode)
      node.id = crypto.randomUUID()
      node.lockKey = undefined
      if (typeof node.dataId === 'string') {
        node.dataId = dataSourceIdMap.get(node.dataId) ?? node.dataId
      }
      return node
    })
    const translation = getBoundedNodeTranslation(mergedNodes, { kind: 'preserve' })
    mergedNodes.forEach((node) => {
      node.layout.x += translation.x
      node.layout.y += translation.y
    })

    const currentThemeVariableKeys = new Set(theme.value.variables.map((variable) => variable.key))
    const missingThemeVariables = sourcePage.theme.variables
      .filter((variable) => !currentThemeVariableKeys.has(variable.key))
      .map((variable) => deepClone(variable))

    dispatchCommandBatch(() => {
      if (mergedNodes.length) setNodes([...nodes.value, ...mergedNodes])
      if (mergedDataSources.length) {
        dispatchCommand(
          new SetFormFieldCommand(
            getPageData,
            'dataSources',
            [...dataSources.value, ...mergedDataSources],
            { clone: 'shallow' },
          ),
        )
      }
      if (missingThemeVariables.length) {
        dispatchCommand(
          new SetFormFieldCommand(
            getPageData,
            'theme',
            {
              ...theme.value,
              variables: [...theme.value.variables, ...missingThemeVariables],
            },
            { clone: 'shallow' },
          ),
        )
      }
    })

    selectNodes(mergedNodes.map((node) => node.id))
    return {
      nodeCount: mergedNodes.length,
      dataSourceCount: mergedDataSources.length,
      hasEventScripts: sourcePage.nodes.some((node) =>
        node.events?.some((event) => Boolean(event.code)),
      ),
    }
  }

  function removeNodes(ids: string[]) {
    const selectedNodes = getNodesByIds(ids)
    if (!selectedNodes.length) return

    const selectedIds = new Set(selectedNodes.map((node) => node.id))
    const remainingNodes = nodes.value.filter((node) => !selectedIds.has(node.id))
    setNodes(remainingNodes)
  }

  function moveNodesBy(ids: string[], offset: { x: number; y: number }) {
    const movableNodes = getNodesByIds(ids).filter((node) => !node.lockKey)
    if (!movableNodes.length) return

    const translation = getBoundedNodeTranslation(movableNodes, {
      kind: 'offset',
      x: offset.x,
      y: offset.y,
    })
    if (!translation.x && !translation.y) return

    const movableIds = new Set(movableNodes.map((node) => node.id))
    setNodes(
      nodes.value.map((node) =>
        movableIds.has(node.id)
          ? {
              ...node,
              layout: {
                ...node.layout,
                x: node.layout.x + translation.x,
                y: node.layout.y + translation.y,
              },
            }
          : node,
      ),
    )
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
    selectAllNodes,
    findNode,
    findNodesByLockKey,
    requireNode,
    duplicateNodes,
    pasteNodes,
    mergePage,
    removeNodes,
    moveNodesBy,
    moveNodesToFront,
    moveNodesToBack,
    lockNodes,
    unlockNodes,
    updateNode,
    setPage,
  }
})
