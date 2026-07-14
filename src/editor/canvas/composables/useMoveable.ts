import { type OnDrag, type OnDragGroup, type OnResize, type OnResizeGroup } from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { SetFormFieldCommand } from '@vunio/ui'
import type { Layout, MaterialSchema } from '@/schema/material.ts'

interface PendingNodeLayout {
  nodeId: MaterialSchema['id']
  initialLayout: Layout
  layout: Layout
}

export function useMoveable() {
  const editorStore = useEditorStore()
  const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()
  const pendingLayouts = new Map<HTMLElement, PendingNodeLayout>()
  const isMoveableActive = ref(false)

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

    const initialLayout = { ...node.layout }
    const created = {
      nodeId: node.id,
      initialLayout,
      layout: { ...initialLayout },
    }
    pendingLayouts.set(target, created)
    return created
  }

  function onStart() {
    pendingLayouts.clear()
    isMoveableActive.value = true
    startBatch()
  }

  function onEnd() {
    pendingLayouts.forEach(({ nodeId, initialLayout, layout }) => {
      const currentNode = editorStore.findNode(nodeId)
      if (!currentNode) return

      const unchanged =
        initialLayout.x === layout.x &&
        initialLayout.y === layout.y &&
        initialLayout.width === layout.width &&
        initialLayout.height === layout.height

      if (!unchanged) {
        Object.assign(currentNode.layout, initialLayout)
        dispatchCommand(
          new SetFormFieldCommand(() => editorStore.requireNode(nodeId), 'layout', layout),
        )
      }
    })

    pendingLayouts.clear()
    commitBatch()
    isMoveableActive.value = false
  }

  function onDrag(e: OnDrag) {
    const target = e.target as HTMLElement
    target.style.left = e.left + 'px'
    target.style.top = e.top + 'px'
    const pending = getPendingLayout(target)
    if (!pending) return

    pending.layout.x = e.left
    pending.layout.y = e.top
    const node = editorStore.findNode(pending.nodeId)
    if (node) {
      node.layout.x = e.left
      node.layout.y = e.top
    }
  }

  function onResize(e: OnResize) {
    const target = e.target as HTMLElement
    target.style.width = e.width + 'px'
    target.style.height = e.height + 'px'
    const pending = getPendingLayout(target)
    if (!pending) return

    pending.layout.width = e.width
    pending.layout.height = e.height
    const node = editorStore.findNode(pending.nodeId)
    if (node) {
      node.layout.width = e.width
      node.layout.height = e.height
    }
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
    isMoveableActive: readonly(isMoveableActive),
    moveableBounds,
    onStart,
    onEnd,
    onDrag,
    onResize,
    onDragGroup,
    onResizeGroup,
  }
}
