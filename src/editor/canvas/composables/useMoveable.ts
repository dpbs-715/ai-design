import { type OnDrag, type OnDragGroup, type OnResize, type OnResizeGroup } from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { SetFormFieldCommand } from '@vunio/ui'

export function useMoveable({ moveableRef }) {
  const editorStore = useEditorStore()
  const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()

  function getNodeByTarget(element: HTMLElement) {
    const id = element.getAttribute('data-node-id')
    return editorStore.findNode(id)
  }

  watch(
    () =>
      editorStore.nodes.map((node) => {
        return node.layout
      }),
    () => {
      moveableRef.value.updateRect(undefined, true)
    },
    {
      flush: 'post',
    },
  )

  function onStart() {
    startBatch()
  }
  function onEnd() {
    commitBatch()
  }
  function onDrag(e: OnDrag) {
    e.target.style.left = e.left + 'px'
    e.target.style.top = e.top + 'px'
    const node = getNodeByTarget(e.target as HTMLElement)

    dispatchCommand(
      new SetFormFieldCommand(() => node, 'layout', {
        ...node.layout,
        x: e.left,
        y: e.top,
      }),
    )
  }

  function onResize(e: OnResize) {
    e.target.style.width = e.width + 'px'
    e.target.style.height = e.height + 'px'
    const node = getNodeByTarget(e.target as HTMLElement)
    dispatchCommand(
      new SetFormFieldCommand(() => node, 'layout', {
        ...node.layout,
        width: e.width,
        height: e.height,
      }),
    )
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
    onStart,
    onEnd,
    onDrag,
    onResize,
    onDragGroup,
    onResizeGroup,
  }
}
