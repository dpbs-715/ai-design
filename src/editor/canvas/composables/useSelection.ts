import type { MaterialSchema } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import type { Ref, ShallowRef } from 'vue'

interface UseSelectionOptions {
  stageRef: Readonly<ShallowRef<HTMLElement | null>>
  moveableRef: Readonly<
    ShallowRef<{
      dragStart: (event: MouseEvent) => void
      updateRect: () => void
    } | null>
  >
  isMoveableActive: Readonly<Ref<boolean>>
}

export function useSelection({ stageRef, moveableRef, isMoveableActive }: UseSelectionOptions) {
  const editorStore = useEditorStore()
  const selectedTarget = shallowRef<HTMLElement[]>([])
  const { nodes, selectedNodeIds } = storeToRefs(editorStore)

  function onSelect(node: MaterialSchema, event: MouseEvent) {
    if (!editorStore.isNodeSelected(node.id)) editorStore.selectNode(node.id)

    nextTick(() => {
      moveableRef.value?.dragStart(event)
    })
  }

  function onClearSelected() {
    editorStore.clearSelection()
  }

  function onSelectEnd(e) {
    const ids = e.selected.flatMap((element) => {
      const id = element.getAttribute('data-node-id')
      return id ? [id] : []
    })
    editorStore.selectNodes(ids)
  }

  watch(
    [nodes, selectedNodeIds],
    async () => {
      await nextTick()

      const stage = stageRef.value
      if (!stage) {
        selectedTarget.value = []
        return
      }

      const movableIds = new Set(editorStore.selectedNodeIds)
      const targets = Array.from(stage.querySelectorAll<HTMLElement>('.canvas-node')).filter(
        (element) => movableIds.has(element.dataset.nodeId ?? ''),
      )

      selectedTarget.value = targets
    },
    { flush: 'post' },
  )

  let updateFrame: number | undefined

  function scheduleMoveableUpdate() {
    if (updateFrame !== undefined) return

    updateFrame = requestAnimationFrame(() => {
      updateFrame = undefined
      if (!isMoveableActive.value) moveableRef.value?.updateRect()
    })
  }

  onScopeDispose(() => {
    if (updateFrame !== undefined) cancelAnimationFrame(updateFrame)
  })

  const selectedLayouts = computed(() =>
    editorStore.selectedNodeIds.map((id) => {
      const node = editorStore.findNode(id)

      return node
        ? {
            id: node.id,
            x: node.layout.x,
            y: node.layout.y,
            width: node.layout.width,
            height: node.layout.height,
          }
        : null
    }),
  )

  watch(
    selectedLayouts,
    () => {
      if (isMoveableActive.value) return
      scheduleMoveableUpdate()
    },
    { flush: 'post' },
  )

  return {
    selectedTarget,
    onSelect,
    onClearSelected,
    onSelectEnd,
  }
}
