import { type OnDrag, type OnDragGroup, type OnResize, type OnResizeGroup } from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { SetFormFieldCommand } from '@vunio/ui'
import type { Layout, MaterialSchema } from '@/schema/material.ts'

interface PendingNodeLayout {
  node: MaterialSchema
  layout: Layout
}

export function useMoveable() {
  const editorStore = useEditorStore()
  const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()
  const pendingLayouts = new Map<HTMLElement, PendingNodeLayout>()

  const moveableBounds = {
    position: 'css' as const,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  }

  function getPendingLayout(target: HTMLElement) {
    const pendingLayout = pendingLayouts.get(target)
    if (pendingLayout) return pendingLayout

    const node = editorStore.findNode(target.dataset.nodeId)
    if (!node) return

    const created = { node, layout: { ...node.layout } }
    pendingLayouts.set(target, created)
    return created
  }

  function onStart() {
    pendingLayouts.clear()
    startBatch()
  }

  function onEnd() {
    pendingLayouts.forEach(({ node, layout }) => {
      const nodeId = node.id
      const currentNode = editorStore.findNode(nodeId)
      if (!currentNode) return

      const current = currentNode.layout
      const unchanged =
        current.x === layout.x &&
        current.y === layout.y &&
        current.width === layout.width &&
        current.height === layout.height

      if (!unchanged) {
        dispatchCommand(
          new SetFormFieldCommand(() => editorStore.requireNode(nodeId), 'layout', layout),
        )
      }
    })

    pendingLayouts.clear()
    commitBatch()
  }

  function onDrag(e: OnDrag) {
    const target = e.target as HTMLElement
    target.style.left = e.left + 'px'
    target.style.top = e.top + 'px'
    const pending = getPendingLayout(target)
    if (!pending) return

    pending.layout.x = e.left
    pending.layout.y = e.top
  }

  function onResize(e: OnResize) {
    const target = e.target as HTMLElement
    target.style.width = e.width + 'px'
    target.style.height = e.height + 'px'
    const pending = getPendingLayout(target)
    if (!pending) return

    pending.layout.width = e.width
    pending.layout.height = e.height
    onDrag(e.drag)
  }
  function onDragGroup(e: OnDragGroup) {
    e.events.forEach((event) => {
      onDrag(event)
    })
  }
  function onResizeGroup(e: OnResizeGroup) {
    e.events.forEach((event) => {
      onResize(event)
    })
  }

  return {
    moveableBounds,
    onStart,
    onEnd,
    onDrag,
    onResize,
    onDragGroup,
    onResizeGroup,
  }
}
