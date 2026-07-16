import type { DropdownInstance, Measurable } from 'element-plus'
import type { MaterialSchema } from '@/schema/material.ts'
import type { NodeContextMenuCommand } from '@/editor/canvas/contextMenu.ts'
import { useEditorStore } from '@/stores/editor.ts'

interface UseNodeContextMenuOptions {
  onNodeLockChange: () => void
}

export function useNodeContextMenu({ onNodeLockChange }: UseNodeContextMenuOptions) {
  const editorStore = useEditorStore()
  const contextMenuRef = useTemplateRef<DropdownInstance>('contextMenu')
  const contextMenuNode = ref<MaterialSchema | null>(null)
  const contextMenuAnchor = shallowRef<Measurable>()

  function closeContextMenu() {
    contextMenuRef.value?.handleClose()
  }

  async function openContextMenu(node: MaterialSchema, event: MouseEvent) {
    closeContextMenu()
    contextMenuNode.value = node
    contextMenuAnchor.value = {
      getBoundingClientRect: () => DOMRect.fromRect({ x: event.clientX, y: event.clientY }),
    }

    await nextTick()
    contextMenuRef.value?.handleOpen()
  }

  const commandHandlers: Record<NodeContextMenuCommand, (node: MaterialSchema) => void> = {
    copy: (node) => editorStore.copyNode(node),
    remove: (node) => editorStore.removeNode(node),
    moveTop: (node) => editorStore.moveBottom(node),
    moveBottom: (node) => editorStore.moveTop(node),
    toggleLock: (node) => {
      editorStore.toggleLock(node)
      onNodeLockChange()
    },
  }

  function onContextMenuCommand(command: NodeContextMenuCommand) {
    if (contextMenuNode.value) commandHandlers[command](contextMenuNode.value)
  }

  return {
    contextMenuNode,
    contextMenuAnchor,
    openContextMenu,
    closeContextMenu,
    onContextMenuCommand,
  }
}
