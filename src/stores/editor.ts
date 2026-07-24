import { defineStore } from 'pinia'

import type { MaterialSchema } from '@/schema/material.ts'
import type { PageRootSchema, PageSchema } from '@/schema/page.ts'
import { createMaterialTreeIndex, mapMaterialTree, someMaterialNode } from '@/schema/nodeTree.ts'
import { deepClone } from '@vunio/utils'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { SetFormFieldCommand } from '@vunio/ui'
import {
  createDefaultRenderTheme,
  createThemeColorReference,
  normalizeRenderTheme,
} from '@/theme/renderTheme.ts'
import { canMaterialAcceptChild } from '@/materials'
import { parsePageSchema, type SchemaParseResult } from '@/schema/validation.ts'

export type NodePastePlacement =
  | { kind: 'preserve' }
  | { kind: 'offset'; x: number; y: number }
  | { kind: 'cascade'; x: number; y: number }
  | { kind: 'point'; point: { x: number; y: number } }

export interface CanvasRect {
  x: number
  y: number
  width: number
  height: number
}

function createDefaultPage(): PageSchema {
  return {
    schemaVersion: 1,
    theme: createDefaultRenderTheme(),
    root: {
      id: 'page-root',
      type: 'page-root',
      name: '页面',
      placement: {
        type: 'canvas',
        width: 1920,
        height: 1080,
      },
      style: {
        background: {
          color: createThemeColorReference('page-background'),
          image: {
            src: '',
            fit: 'cover',
            position: 'center center',
            repeat: 'no-repeat',
            opacity: 1,
          },
        },
      },
      props: {},
      events: [],
      children: [],
    },
    dataSources: [
      {
        type: 'static',
        id: '123',
        name: '销售数据',
        data: [
          { label: 'label1', value: 100 },
          { label: 'label2', value: 200 },
          { label: 'label3', value: 300 },
        ],
      },
      {
        type: 'static',
        id: '456',
        name: '访问数据',
        data: [
          { label: '1label1', value: 1001 },
          { label: '2label2', value: 2002 },
          { label: '3label3', value: 3003 },
        ],
      },
      {
        type: 'api',
        id: '789',
        name: '上升趋势',
        url: '/api/data',
        method: 'get',
        params: {
          date: '2026-10-10',
        },
        data: [],
      },
    ],
  }
}

function cloneNodeTree(
  sourceNode: MaterialSchema,
  dataSourceIdMap?: ReadonlyMap<string, string>,
): MaterialSchema {
  const { children, ...nodeSource } = sourceNode
  const node = deepClone(nodeSource)
  node.id = crypto.randomUUID()
  node.lockKey = undefined
  if (typeof node.dataId === 'string') {
    node.dataId = dataSourceIdMap?.get(node.dataId) ?? node.dataId
  }
  return {
    ...node,
    children: children.map((child) => cloneNodeTree(child, dataSourceIdMap)),
  }
}

export const useEditorStore = defineStore('editor', () => {
  const { dispatchCommand, startBatch, commitBatch, clearHistory } = useUndoRedo()

  const page = ref<PageSchema>(createDefaultPage())
  const root = computed(() => page.value.root)
  const canvas = computed(() => page.value.root.placement)
  const rootChildren = computed(() => page.value.root.children)
  const theme = computed(() => page.value.theme)
  const dataSources = computed(() => page.value.dataSources)
  const treeIndex = computed(() => createMaterialTreeIndex(rootChildren.value, page.value.root.id))
  const nodes = computed(() => treeIndex.value.nodes)

  const selectedNodeIds = ref<string[]>([])

  function getNodeLockKey(id: string) {
    let currentId: string | undefined = id
    let effectiveLockKey: string | undefined

    while (currentId && currentId !== root.value.id) {
      const node = treeIndex.value.nodeMap.get(currentId)
      if (node?.lockKey) effectiveLockKey = node.lockKey
      currentId = treeIndex.value.parentIdMap.get(currentId)
    }

    return effectiveLockKey
  }

  watch(
    nodes,
    (currentNodes) => {
      const selectableNodeIds = new Set(
        currentNodes.filter((node) => !getNodeLockKey(node.id)).map((node) => node.id),
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
    return id ? treeIndex.value.nodeMap.get(id) : undefined
  })

  function setPage(newPage: unknown): SchemaParseResult<PageSchema> {
    const result = parsePageSchema(newPage)
    if (!result.success) return result

    clearHistory()
    clearSelection()
    page.value = {
      ...result.data,
      theme: normalizeRenderTheme(result.data.theme),
    }
    return result
  }

  function setPageId(id: string) {
    page.value.id = id
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
    return id ? treeIndex.value.nodeMap.get(id) : undefined
  }

  function requireNode(id: string) {
    const node = findNode(id)
    if (!node) throw new Error(`Node ${id} not found`)
    return node
  }

  function findParentId(id: string) {
    return treeIndex.value.parentIdMap.get(id)
  }

  function getContainer(id: string): PageRootSchema | MaterialSchema | undefined {
    return id === root.value.id ? root.value : findNode(id)
  }

  function getChildren(parentId: string) {
    return getContainer(parentId)?.children ?? []
  }

  function setChildren(parentId: string, children: MaterialSchema[]) {
    const getContainerData = () => getContainer(parentId)
    if (!getContainerData()) return

    dispatchCommand(
      new SetFormFieldCommand(getContainerData, 'children', children, {
        clone: 'shallow',
      }),
    )
  }

  function getNodesByIds(ids: string[]) {
    const nodeIds = new Set(ids)
    return nodes.value.filter((node) => nodeIds.has(node.id))
  }

  function findNodesByLockKey(lockKey: string) {
    return nodes.value.filter((node) => node.lockKey === lockKey)
  }

  function addNode(node: MaterialSchema, parentId = root.value.id) {
    const parent = getContainer(parentId)
    if (
      !parent ||
      ('lockKey' in parent && getNodeLockKey(parent.id)) ||
      !canMaterialAcceptChild(parent, node)
    ) {
      return false
    }
    setChildren(parentId, [...getChildren(parentId), node])
    return true
  }

  function selectNode(id: string) {
    const node = findNode(id)
    if (!node || getNodeLockKey(id)) {
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
      return node && !getNodeLockKey(id)
    })
  }

  function toggleNodeSelection(id: string) {
    const node = findNode(id)
    if (!node || getNodeLockKey(id)) return

    if (isNodeSelected(id)) {
      selectedNodeIds.value = selectedNodeIds.value.filter((selectedId) => selectedId !== id)
      return
    }

    const parentId = findParentId(id)
    const selectedSiblingIds = selectedNodeIds.value.filter(
      (selectedId) => findParentId(selectedId) === parentId,
    )
    selectedNodeIds.value = [...selectedSiblingIds, id]
  }

  function selectAllNodes() {
    selectNodes(rootChildren.value.map((node) => node.id))
  }

  function getNodeBorderWidth(node: MaterialSchema) {
    return typeof node.style?.borderWidth === 'number' ? Math.max(node.style.borderWidth, 0) : 0
  }

  function getContainerContentRect(parentId: string): CanvasRect | undefined {
    if (parentId === root.value.id) {
      return {
        x: 0,
        y: 0,
        width: root.value.placement.width,
        height: root.value.placement.height,
      }
    }

    const parent = findNode(parentId)
    if (!parent) return

    const ancestors: MaterialSchema[] = []
    let current: MaterialSchema | undefined = parent
    while (current) {
      ancestors.unshift(current)
      const ancestorParentId = findParentId(current.id)
      if (!ancestorParentId || ancestorParentId === root.value.id) break
      current = findNode(ancestorParentId)
    }

    let x = 0
    let y = 0
    ancestors.forEach((ancestor) => {
      const borderWidth = getNodeBorderWidth(ancestor)
      x += ancestor.placement.x + borderWidth
      y += ancestor.placement.y + borderWidth
    })

    const borderWidth = getNodeBorderWidth(parent)
    return {
      x,
      y,
      width: Math.max(parent.placement.width - borderWidth * 2, 0),
      height: Math.max(parent.placement.height - borderWidth * 2, 0),
    }
  }

  function getNodeCanvasRect(id: string): CanvasRect | undefined {
    const node = findNode(id)
    const parentId = findParentId(id)
    if (!node || !parentId) return

    const parentRect = getContainerContentRect(parentId)
    if (!parentRect) return

    return {
      x: parentRect.x + node.placement.x,
      y: parentRect.y + node.placement.y,
      width: node.placement.width,
      height: node.placement.height,
    }
  }

  function getBoundedNodeTranslation(
    sourceNodes: MaterialSchema[],
    placement: NodePastePlacement,
    parentId: string,
  ) {
    if (!sourceNodes.length) return { x: 0, y: 0 }

    const minX = Math.min(...sourceNodes.map((node) => node.placement.x))
    const minY = Math.min(...sourceNodes.map((node) => node.placement.y))
    const maxX = Math.max(...sourceNodes.map((node) => node.placement.x + node.placement.width))
    const maxY = Math.max(...sourceNodes.map((node) => node.placement.y + node.placement.height))
    const groupWidth = maxX - minX
    const groupHeight = maxY - minY
    const parentRect = getContainerContentRect(parentId)
    if (!parentRect) return { x: 0, y: 0 }
    const maxLeft = Math.max(parentRect.width - groupWidth, 0)
    const maxTop = Math.max(parentRect.height - groupHeight, 0)

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

  function getCommonParentId(sourceNodes: MaterialSchema[]) {
    if (!sourceNodes.length) return undefined
    const parentId = findParentId(sourceNodes[0].id)
    return sourceNodes.every((node) => findParentId(node.id) === parentId) ? parentId : undefined
  }

  function duplicateNodes(ids: string[]) {
    const sourceNodes = getNodesByIds(ids).filter((node) => !getNodeLockKey(node.id))
    const parentId = getCommonParentId(sourceNodes)
    if (!parentId) return

    const translation = getBoundedNodeTranslation(
      sourceNodes,
      { kind: 'cascade', x: 20, y: 20 },
      parentId,
    )
    const copies = sourceNodes.map((sourceNode) => {
      const copy = cloneNodeTree(sourceNode)
      copy.placement.x += translation.x
      copy.placement.y += translation.y
      return copy
    })
    if (!copies.length) return

    setChildren(parentId, [...getChildren(parentId), ...copies])
    selectNodes(copies.map((node) => node.id))
  }

  function pasteNodes(
    sourceNodes: MaterialSchema[],
    placement: NodePastePlacement,
    parentId = root.value.id,
  ) {
    if (!sourceNodes.length) return 0
    const parent = getContainer(parentId)
    if (
      !parent ||
      ('lockKey' in parent && getNodeLockKey(parent.id)) ||
      sourceNodes.some((node) => !canMaterialAcceptChild(parent, node))
    ) {
      return 0
    }

    const translation = getBoundedNodeTranslation(sourceNodes, placement, parentId)
    const pastedNodes = sourceNodes.map((sourceNode) => {
      const node = cloneNodeTree(sourceNode)
      node.placement.x += translation.x
      node.placement.y += translation.y
      return node
    })

    setChildren(parentId, [...getChildren(parentId), ...pastedNodes])
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

    const mergedNodes = sourcePage.root.children.map((sourceNode) =>
      cloneNodeTree(sourceNode, dataSourceIdMap),
    )
    const translation = getBoundedNodeTranslation(mergedNodes, { kind: 'preserve' }, root.value.id)
    mergedNodes.forEach((node) => {
      node.placement.x += translation.x
      node.placement.y += translation.y
    })

    const currentThemeVariableKeys = new Set(theme.value.variables.map((variable) => variable.key))
    const missingThemeVariables = sourcePage.theme.variables
      .filter((variable) => !currentThemeVariableKeys.has(variable.key))
      .map((variable) => deepClone(variable))

    dispatchCommandBatch(() => {
      if (mergedNodes.length) {
        setChildren(root.value.id, [...rootChildren.value, ...mergedNodes])
      }
      if (mergedDataSources.length) {
        const getPageData = () => page.value
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
        const getPageData = () => page.value
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
      hasEventScripts: someMaterialNode(sourcePage.root.children, (node) =>
        Boolean(node.events?.some((event) => Boolean(event.code))),
      ),
    }
  }

  function removeNodes(ids: string[]) {
    const selectedIds = new Set(getNodesByIds(ids).map((node) => node.id))
    if (!selectedIds.size) return

    const parentIds = new Set<string>()
    selectedIds.forEach((id) => {
      const parentId = findParentId(id)
      if (parentId && !selectedIds.has(parentId)) parentIds.add(parentId)
    })

    dispatchCommandBatch(() => {
      parentIds.forEach((parentId) => {
        setChildren(
          parentId,
          getChildren(parentId).filter((node) => !selectedIds.has(node.id)),
        )
      })
    })
    selectedNodeIds.value = selectedNodeIds.value.filter((id) => !selectedIds.has(id))
  }

  function moveNodesBy(ids: string[], offset: { x: number; y: number }) {
    const movableNodes = getNodesByIds(ids).filter((node) => !getNodeLockKey(node.id))
    const parentId = getCommonParentId(movableNodes)
    if (!parentId) return

    const translation = getBoundedNodeTranslation(
      movableNodes,
      { kind: 'offset', x: offset.x, y: offset.y },
      parentId,
    )
    if (!translation.x && !translation.y) return

    const movableIds = new Set(movableNodes.map((node) => node.id))
    setChildren(
      parentId,
      getChildren(parentId).map((node) =>
        movableIds.has(node.id)
          ? {
              ...node,
              placement: {
                ...node.placement,
                x: node.placement.x + translation.x,
                y: node.placement.y + translation.y,
              },
            }
          : node,
      ),
    )
  }

  function reorderNodes(ids: string[], position: 'front' | 'back') {
    const selectedNodes = getNodesByIds(ids)
    const parentId = getCommonParentId(selectedNodes)
    if (!parentId || selectedNodes.some((node) => getNodeLockKey(node.id))) return

    const selectedIds = new Set(selectedNodes.map((node) => node.id))
    const siblings = getChildren(parentId)
    const orderedSelectedNodes = siblings.filter((node) => selectedIds.has(node.id))
    const remainingNodes = siblings.filter((node) => !selectedIds.has(node.id))
    const reorderedNodes =
      position === 'front'
        ? [...remainingNodes, ...orderedSelectedNodes]
        : [...orderedSelectedNodes, ...remainingNodes]
    if (reorderedNodes.every((node, index) => node === siblings[index])) return
    setChildren(parentId, reorderedNodes)
  }

  function moveNodesToFront(ids: string[]) {
    reorderNodes(ids, 'front')
  }

  function moveNodesToBack(ids: string[]) {
    reorderNodes(ids, 'back')
  }

  function moveNodeToSiblingPosition(sourceId: string, targetId: string) {
    if (sourceId === targetId) return
    const source = findNode(sourceId)
    const target = findNode(targetId)
    if (!source || !target || getNodeLockKey(sourceId) || getNodeLockKey(targetId)) return

    const parentId = findParentId(sourceId)
    if (!parentId || parentId !== findParentId(targetId)) return

    const siblings = getChildren(parentId)
    const sourceIndex = siblings.findIndex((node) => node.id === sourceId)
    const targetIndex = siblings.findIndex((node) => node.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const reordered = siblings.filter((node) => node.id !== sourceId)
    reordered.splice(targetIndex, 0, source)
    setChildren(parentId, reordered)
  }

  function replaceTreeNodes(transform: (node: MaterialSchema) => MaterialSchema) {
    setChildren(root.value.id, mapMaterialTree(rootChildren.value, transform))
  }

  function lockNodes(ids: string[]) {
    const lockableIds = new Set(
      getNodesByIds(ids)
        .filter((node) => !getNodeLockKey(node.id))
        .map((node) => node.id),
    )
    if (!lockableIds.size) return

    const lockKey = crypto.randomUUID()
    replaceTreeNodes((node) => (lockableIds.has(node.id) ? { ...node, lockKey } : node))
  }

  function unlockNodes(ids: string[]) {
    const lockKeys = new Set(
      getNodesByIds(ids).flatMap((node) => (node.lockKey ? [node.lockKey] : [])),
    )
    if (!lockKeys.size) return

    replaceTreeNodes((node) =>
      node.lockKey && lockKeys.has(node.lockKey) ? { ...node, lockKey: undefined } : node,
    )
  }

  function updateNode(id: string, newNode: MaterialSchema): SchemaParseResult<MaterialSchema> {
    const parentId = findParentId(id)
    if (!parentId || newNode.id !== id) {
      return {
        success: false,
        issues: [{ path: ['id'], message: '节点不存在或节点 id 不可修改' }],
      }
    }

    const nextRootChildren = mapMaterialTree(rootChildren.value, (node) =>
      node.id === id ? newNode : node,
    )
    const nextPage = {
      ...page.value,
      root: {
        ...root.value,
        children: nextRootChildren,
      },
    }
    const result = parsePageSchema(nextPage)
    if (result.success === false) return { success: false, issues: result.issues }
    const validatedNode = createMaterialTreeIndex(
      result.data.root.children,
      result.data.root.id,
    ).nodeMap.get(id)
    if (!validatedNode) {
      return {
        success: false,
        issues: [{ path: ['id'], message: '校验后的节点不存在' }],
      }
    }

    setChildren(
      parentId,
      getChildren(parentId).map((node) => (node.id === id ? validatedNode : node)),
    )
    return { success: true, data: validatedNode }
  }

  return {
    page,
    root,
    rootChildren,
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
    toggleNodeSelection,
    selectAllNodes,
    findNode,
    findParentId,
    getChildren,
    getContainerContentRect,
    getNodeCanvasRect,
    getNodeLockKey,
    findNodesByLockKey,
    requireNode,
    duplicateNodes,
    pasteNodes,
    mergePage,
    removeNodes,
    moveNodesBy,
    moveNodesToFront,
    moveNodesToBack,
    moveNodeToSiblingPosition,
    lockNodes,
    unlockNodes,
    updateNode,
    setPage,
    setPageId,
  }
})
