import {
  type OnDrag,
  type OnDragGroup,
  type OnResize,
  type OnResizeGroup,
  type OnResizeGroupStart,
  type OnResizeStart,
} from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { SetFormFieldCommand } from '@vunio/ui'
import {
  isAbsolutePlacement,
  type AbsolutePlacement,
  type MaterialSchema,
} from '@/schema/material.ts'

const MIN_NODE_SIZE = 1

interface PendingNodePlacement {
  nodeId: MaterialSchema['id']
  initialPlacement: AbsolutePlacement
  placement: AbsolutePlacement
}

export function useMoveable() {
  const editorStore = useEditorStore()
  const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()
  const pendingPlacements = new Map<HTMLElement, PendingNodePlacement>()
  const isMoveableActive = ref(false)

  function getPendingPlacement(target: HTMLElement) {
    const pendingPlacement = pendingPlacements.get(target)
    if (pendingPlacement) return pendingPlacement

    const node = editorStore.findNode(target.dataset.nodeId)
    if (!node || !isAbsolutePlacement(node.placement)) return

    const initialPlacement: AbsolutePlacement = { ...node.placement }
    const created = {
      nodeId: node.id,
      initialPlacement,
      placement: { ...initialPlacement },
    }
    pendingPlacements.set(target, created)
    return created
  }

  function onStart() {
    pendingPlacements.clear()
    isMoveableActive.value = true
    startBatch()
  }

  function setMinimumResizeSize(event: OnResizeStart) {
    event.setMin([MIN_NODE_SIZE, MIN_NODE_SIZE])
  }

  function onResizeStart(event: OnResizeStart) {
    setMinimumResizeSize(event)
    onStart()
  }

  function onResizeGroupStart(event: OnResizeGroupStart) {
    event.events.forEach(setMinimumResizeSize)
    onStart()
  }

  function onEnd() {
    pendingPlacements.forEach(({ nodeId, initialPlacement, placement }) => {
      const currentNode = editorStore.findNode(nodeId)
      if (!currentNode) return

      const unchanged =
        initialPlacement.x === placement.x &&
        initialPlacement.y === placement.y &&
        initialPlacement.width === placement.width &&
        initialPlacement.height === placement.height

      if (!unchanged) {
        Object.assign(currentNode.placement, initialPlacement)
        dispatchCommand(
          new SetFormFieldCommand(() => editorStore.requireNode(nodeId), 'placement', placement),
        )
      }
    })

    pendingPlacements.clear()
    commitBatch()
    isMoveableActive.value = false
  }

  function onDrag(e: OnDrag) {
    const target = e.target as HTMLElement
    target.style.left = e.left + 'px'
    target.style.top = e.top + 'px'
    const pending = getPendingPlacement(target)
    if (!pending) return

    pending.placement.x = e.left
    pending.placement.y = e.top
    const node = editorStore.findNode(pending.nodeId)
    if (node && isAbsolutePlacement(node.placement)) {
      node.placement.x = e.left
      node.placement.y = e.top
    }
  }

  function onResize(e: OnResize) {
    const target = e.target as HTMLElement
    target.style.width = e.width + 'px'
    target.style.height = e.height + 'px'
    const pending = getPendingPlacement(target)
    if (!pending) return

    pending.placement.width = e.width
    pending.placement.height = e.height
    const node = editorStore.findNode(pending.nodeId)
    if (node && isAbsolutePlacement(node.placement)) {
      node.placement.width = e.width
      node.placement.height = e.height
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
    onStart,
    onResizeStart,
    onResizeGroupStart,
    onEnd,
    onDrag,
    onResize,
    onDragGroup,
    onResizeGroup,
  }
}
