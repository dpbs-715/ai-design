import type { DropdownInstance, Measurable } from 'element-plus'
import type { Ref, ShallowRef } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import {
  canvasContextMenuCommands,
  type CanvasContextMenuCommand,
  type CanvasContextMenuTarget,
  type CanvasPoint,
} from '@/editor/canvas/contextMenu.ts'
import { useEditorStore } from '@/stores/editor.ts'

interface UseCanvasContextMenuOptions {
  canvasRootRef: Readonly<ShallowRef<HTMLElement | null>>
  stageRef: Readonly<ShallowRef<HTMLElement | null>>
  scale: Readonly<Ref<number>>
  copyNodes: (nodes: MaterialSchema[]) => Promise<boolean>
  pasteAt: (point: CanvasPoint) => Promise<void>
}

export function useCanvasContextMenu({
  canvasRootRef,
  stageRef,
  scale,
  copyNodes,
  pasteAt,
}: UseCanvasContextMenuOptions) {
  const editorStore = useEditorStore()
  const contextMenuRef = useTemplateRef<DropdownInstance>('contextMenu')
  const contextMenuTarget = shallowRef<CanvasContextMenuTarget | null>(null)
  const contextMenuAnchor = shallowRef<Measurable>()
  const contextMenuNodes = computed(() => {
    const target = contextMenuTarget.value
    if (!target || target.kind === 'canvas') return []
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

  function getCanvasPoint(event: MouseEvent): CanvasPoint | null {
    const stage = stageRef.value
    if (!stage || scale.value <= 0) return null

    const rect = stage.getBoundingClientRect()
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return null
    }

    return {
      x: (event.clientX - rect.left) / scale.value,
      y: (event.clientY - rect.top) / scale.value,
    }
  }

  function findContextMenuNode(event: MouseEvent) {
    const canvasRoot = canvasRootRef.value
    if (!canvasRoot) return

    // Moveable controls can cover selected nodes, so inspect the complete hit stack.
    for (const element of document.elementsFromPoint(event.clientX, event.clientY)) {
      const nodeElement = element.closest<HTMLElement>('.canvas-node')
      if (!nodeElement || !canvasRoot.contains(nodeElement)) continue
      return editorStore.findNode(nodeElement.dataset.nodeId)
    }
  }

  async function openContextMenu(
    node: MaterialSchema | undefined,
    point: CanvasPoint,
    event: MouseEvent,
  ) {
    closeContextMenu()
    if (!node) {
      contextMenuTarget.value = { kind: 'canvas', point }
    } else if (node.lockKey) {
      contextMenuTarget.value = { kind: 'locked-group', lockKey: node.lockKey, point }
    } else {
      if (!editorStore.isNodeSelected(node.id)) editorStore.selectNode(node.id)
      contextMenuTarget.value = {
        kind: 'selection',
        nodeIds: [...editorStore.selectedNodeIds],
        point,
      }
    }
    contextMenuAnchor.value = {
      getBoundingClientRect: () => DOMRect.fromRect({ x: event.clientX, y: event.clientY }),
    }

    await nextTick()
    contextMenuRef.value?.handleOpen()
  }

  function onContextMenu(event: MouseEvent) {
    const point = getCanvasPoint(event)
    if (!point) return

    event.preventDefault()
    event.stopPropagation()
    void openContextMenu(findContextMenuNode(event), point, event)
  }

  function onContextMenuCommand(command: CanvasContextMenuCommand) {
    const target = contextMenuTarget.value
    if (!target) return

    const nodes = contextMenuNodes.value
    contextMenuRef.value?.handleClose()
    contextMenuTarget.value = null

    if (command === canvasContextMenuCommands.paste) {
      void pasteAt(target.point)
      return
    }
    if (!nodes.length) return

    const ids = nodes.map((node) => node.id)
    if (command === canvasContextMenuCommands.duplicate) editorStore.duplicateNodes(ids)
    else if (command === canvasContextMenuCommands.copy) void copyNodes(nodes)
    else if (command === canvasContextMenuCommands.remove) editorStore.removeNodes(ids)
    else if (command === canvasContextMenuCommands.moveFront) editorStore.moveNodesToFront(ids)
    else if (command === canvasContextMenuCommands.moveBack) editorStore.moveNodesToBack(ids)
    else if (command === canvasContextMenuCommands.toggleSelectionLock) {
      if (target.kind === 'locked-group') editorStore.unlockNodes(ids)
      else editorStore.lockNodes(ids)
    }
  }

  return {
    contextMenuTarget,
    contextMenuNodes,
    contextMenuAnchor,
    onContextMenu,
    closeContextMenu,
    onContextMenuCommand,
  }
}
