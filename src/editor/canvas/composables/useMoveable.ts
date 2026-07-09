import { type OnDrag, type OnDragGroup, type OnResize, type OnResizeGroup } from 'vue3-moveable'
import { useEditorStore } from '@/stores/editor.ts'

export function useMoveable() {
  const editorStore = useEditorStore()

  function getNodeByTarget(element: HTMLElement) {
    const id = element.getAttribute('data-node-id')
    return editorStore.findNode(id)
  }

  function onDrag(e: OnDrag) {
    e.target.style.left = e.left + 'px'
    e.target.style.top = e.top + 'px'
    const node = getNodeByTarget(e.target as HTMLElement)
    node.layout.x = e.left
    node.layout.y = e.top
  }
  function onResize(e: OnResize) {
    e.target.style.width = e.width + 'px'
    e.target.style.height = e.height + 'px'
    const node = getNodeByTarget(e.target as HTMLElement)
    node.layout.width = e.width
    node.layout.height = e.height
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
    onDrag,
    onResize,
    onDragGroup,
    onResizeGroup,
  }
}
