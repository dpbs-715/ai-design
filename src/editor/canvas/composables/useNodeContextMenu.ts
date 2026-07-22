import type { DropdownInstance, Measurable } from 'element-plus'
import type { MaterialSchema } from '@/schema/material.ts'
import type { NodeContextMenuCommand, NodeContextMenuTarget } from '@/editor/canvas/contextMenu.ts'
import { useEditorStore } from '@/stores/editor.ts'

export function useNodeContextMenu() {
  const editorStore = useEditorStore()
  const contextMenuRef = useTemplateRef<DropdownInstance>('contextMenu')
  const contextMenuTarget = shallowRef<NodeContextMenuTarget | null>(null)
  const contextMenuAnchor = shallowRef<Measurable>()
  const contextMenuNodes = computed(() => {
    const target = contextMenuTarget.value
    if (!target) return []
    if (target.kind === 'locked-group') return editorStore.findNodesByLockKey(target.lockKey)

    return target.nodeIds.flatMap((id) => {
      const node = editorStore.findNode(id)
      return node ? [node] : []
    })
  })

  function closeContextMenu() {
    contextMenuRef.value?.handleClose()
    contextMenuTarget.value = null
  }

  async function openContextMenu(node: MaterialSchema, event: MouseEvent) {
    closeContextMenu()
    if (node.lockKey) {
      contextMenuTarget.value = { kind: 'locked-group', lockKey: node.lockKey }
    } else {
      if (!editorStore.isNodeSelected(node.id)) editorStore.selectNode(node.id)
      contextMenuTarget.value = { kind: 'selection', nodeIds: [...editorStore.selectedNodeIds] }
    }
    contextMenuAnchor.value = {
      getBoundingClientRect: () => DOMRect.fromRect({ x: event.clientX, y: event.clientY }),
    }

    await nextTick()
    contextMenuRef.value?.handleOpen()
  }

  async function copyNodesJson(nodes: MaterialSchema[]) {
    if (!navigator.clipboard?.writeText) {
      ElMessage.error('当前环境不支持写入剪贴板')
      return
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(nodes, null, 2))
      ElMessage.success('所选物料 JSON 已复制')
    } catch {
      ElMessage.error('复制失败，请检查剪贴板权限')
    }
  }

  type CommandHandler = (nodes: MaterialSchema[], target: NodeContextMenuTarget) => void

  const commandHandlers: Record<NodeContextMenuCommand, CommandHandler> = {
    copy: (nodes) => editorStore.copyNodes(nodes.map((node) => node.id)),
    copyJson: (nodes) => void copyNodesJson(nodes),
    remove: (nodes) => editorStore.removeNodes(nodes.map((node) => node.id)),
    moveFront: (nodes) => editorStore.moveNodesToFront(nodes.map((node) => node.id)),
    moveBack: (nodes) => editorStore.moveNodesToBack(nodes.map((node) => node.id)),
    toggleSelectionLock: (nodes, target) => {
      const ids = nodes.map((node) => node.id)
      if (target.kind === 'locked-group') editorStore.unlockNodes(ids)
      else editorStore.lockNodes(ids)
    },
  }

  function onContextMenuCommand(command: NodeContextMenuCommand) {
    const target = contextMenuTarget.value
    const nodes = contextMenuNodes.value
    if (!target || !nodes.length) return
    commandHandlers[command](nodes, target)
    contextMenuTarget.value = null
  }

  return {
    contextMenuTarget,
    contextMenuNodes,
    contextMenuAnchor,
    openContextMenu,
    closeContextMenu,
    onContextMenuCommand,
  }
}
