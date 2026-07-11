import type { MaterialSchema } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import type { ShallowRef } from 'vue'

interface UseSelectionOptions {
  stageRef: Readonly<ShallowRef<HTMLElement | null>>
  moveableRef: Readonly<
    ShallowRef<{
      dragStart: (event: MouseEvent) => void
      updateRect: () => void
    } | null>
  >
}

export function useSelection({ stageRef, moveableRef }: UseSelectionOptions) {
  const editorStore = useEditorStore()
  const selectedTarget = shallowRef<HTMLElement[]>([])
  const { selectedNodeIds } = storeToRefs(editorStore)

  function onSelect(node: MaterialSchema, e: MouseEvent) {
    editorStore.selectNode(node.id)

    nextTick(() => {
      moveableRef.value?.dragStart(e)
    })
  }

  function onClearSelected() {
    editorStore.clearSelectedNode()
  }

  function onSelectEnd(e) {
    const ids = e.selected.map((element) => element.getAttribute('data-node-id'))
    editorStore.selectNodes(ids)
  }

  watch(
    selectedNodeIds,
    (ids) => {
      const stage = stageRef.value
      if (!stage) {
        selectedTarget.value = []
        return
      }

      const selectedIds = new Set(ids)
      const targets = Array.from(stage.querySelectorAll<HTMLElement>('.canvas-node')).filter(
        (element) =>
          selectedIds.has(element.dataset.nodeId ?? '') && element.dataset.nodeLocked !== 'true',
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
      moveableRef.value?.updateRect()
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
