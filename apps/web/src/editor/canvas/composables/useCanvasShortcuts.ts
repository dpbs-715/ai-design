import { useEventListener } from '@vunio/hooks'
import type { MaterialSchema } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'

interface UseCanvasShortcutsOptions {
  copyNodes: (nodes: MaterialSchema[]) => Promise<boolean>
  cutNodes: (nodes: MaterialSchema[]) => Promise<void>
  pasteFromClipboard: () => Promise<void>
  closeContextMenu: () => void
}

const TEXT_EDITING_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), .monaco-editor'
const ARROW_OFFSETS: Record<string, { x: number; y: number }> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowRight: { x: 1, y: 0 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
}
const LARGE_NUDGE_DISTANCE = 10

function isTextEditingTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(TEXT_EDITING_SELECTOR))
}

function hasOpenModal() {
  return Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).some(
    (dialog) => dialog.getClientRects().length > 0,
  )
}

export function useCanvasShortcuts({
  copyNodes,
  cutNodes,
  pasteFromClipboard,
  closeContextMenu,
}: UseCanvasShortcutsOptions) {
  const editorStore = useEditorStore()
  const { undo, redo } = useUndoRedo()

  function getSelectedNodes() {
    const selectedIds = new Set(editorStore.selectedNodeIds)
    return editorStore.nodes.filter((node) => selectedIds.has(node.id))
  }

  function onPrimaryShortcut(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    const selectedNodes = getSelectedNodes()

    if (key === 'z') {
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    } else if (key === 'y' && !event.shiftKey) {
      event.preventDefault()
      redo()
    } else if (key === 'a' && !event.shiftKey) {
      event.preventDefault()
      editorStore.selectAllNodes()
    } else if (key === 'c' && !event.shiftKey && selectedNodes.length) {
      event.preventDefault()
      void copyNodes(selectedNodes)
    } else if (key === 'x' && !event.shiftKey && selectedNodes.length) {
      event.preventDefault()
      void cutNodes(selectedNodes)
    } else if (key === 'v' && !event.shiftKey) {
      event.preventDefault()
      void pasteFromClipboard()
    } else if (key === 'd' && !event.shiftKey) {
      event.preventDefault()
      if (selectedNodes.length) editorStore.duplicateNodes(selectedNodes.map((node) => node.id))
    }
  }

  function onPlainShortcut(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeContextMenu()
      editorStore.clearSelection()
      return
    }

    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      editorStore.selectedNodeIds.length
    ) {
      event.preventDefault()
      editorStore.removeNodes([...editorStore.selectedNodeIds])
      return
    }

    const arrowOffset = ARROW_OFFSETS[event.key]
    if (!arrowOffset || !editorStore.selectedNodeIds.length) return

    event.preventDefault()
    const distance = event.shiftKey ? LARGE_NUDGE_DISTANCE : 1
    editorStore.moveNodesBy([...editorStore.selectedNodeIds], {
      x: arrowOffset.x * distance,
      y: arrowOffset.y * distance,
    })
  }

  function onKeyDown(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      isTextEditingTarget(event.target) ||
      hasOpenModal()
    ) {
      return
    }

    const arrowKey = event.key in ARROW_OFFSETS
    if (event.repeat && !arrowKey) return

    const primaryModifier = event.metaKey || event.ctrlKey
    if (primaryModifier && !event.altKey) onPrimaryShortcut(event)
    else if (!event.altKey) onPlainShortcut(event)
  }

  useEventListener('keydown', onKeyDown)
}
