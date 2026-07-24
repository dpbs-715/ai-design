import type { DropdownInstance, Measurable } from 'element-plus'
import type { Ref, ShallowRef } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import {
  canvasContextMenuCommands,
  type CanvasContextMenuCommand,
  type CanvasContextMenuTarget,
  type CanvasInsertionTarget,
} from '@/editor/canvas/contextMenu.ts'
import { useEditorStore } from '@/stores/editor.ts'
import { findCanvasDropTarget } from '@/editor/canvas/canvasTarget.ts'

interface UseCanvasContextMenuOptions {
  canvasRootRef: Readonly<ShallowRef<HTMLElement | null>>
  stageRef: Readonly<ShallowRef<HTMLElement | null>>
  scale: Readonly<Ref<number>>
  copyNodes: (nodes: MaterialSchema[]) => Promise<boolean>
  pasteAt: (target: CanvasInsertionTarget) => Promise<void>
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
  let openRequestId = 0
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
    openRequestId += 1
    contextMenuTarget.value = null
    contextMenuAnchor.value = undefined
  }

  function getPasteTarget(event: MouseEvent): CanvasInsertionTarget | null {
    const stage = stageRef.value
    if (!stage) return null
    return findCanvasDropTarget(
      stage,
      editorStore.root.id,
      event.clientX,
      event.clientY,
      scale.value,
    )
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
    pasteTarget: CanvasInsertionTarget,
    event: MouseEvent,
  ) {
    const requestId = ++openRequestId
    contextMenuTarget.value = null
    contextMenuAnchor.value = undefined
    await nextTick()
    if (requestId !== openRequestId) return

    if (!node) {
      contextMenuTarget.value = { kind: 'canvas', pasteTarget }
    } else {
      const lockKey = editorStore.getNodeLockKey(node.id)
      if (lockKey) {
        contextMenuTarget.value = { kind: 'locked-group', lockKey, pasteTarget }
      } else {
        if (!editorStore.isNodeSelected(node.id)) editorStore.selectNode(node.id)
        contextMenuTarget.value = {
          kind: 'selection',
          nodeIds: [...editorStore.selectedNodeIds],
          pasteTarget,
        }
      }
    }
    const anchorX = event.clientX
    const anchorY = event.clientY
    contextMenuAnchor.value = {
      getBoundingClientRect: () => DOMRect.fromRect({ x: anchorX, y: anchorY }),
    }

    await nextTick()
    if (requestId !== openRequestId) return
    contextMenuRef.value?.handleOpen()
  }

  function onContextMenu(event: MouseEvent) {
    const pasteTarget = getPasteTarget(event)
    if (!pasteTarget) return

    event.preventDefault()
    event.stopPropagation()
    void openContextMenu(findContextMenuNode(event), pasteTarget, event)
  }

  function onContextMenuCommand(command: CanvasContextMenuCommand) {
    const target = contextMenuTarget.value
    if (!target) return

    const nodes = contextMenuNodes.value
    closeContextMenu()

    if (command === canvasContextMenuCommands.paste) {
      void pasteAt(target.pasteTarget)
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
