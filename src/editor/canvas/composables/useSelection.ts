import type { MaterialSchema } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { debounce } from '@/utils'
import type { ShallowRef } from 'vue'

interface UseSelectionOptions {
  stageRef: Readonly<ShallowRef<HTMLElement | null>>
  moveableRef: Readonly<
    ShallowRef<
      | {
          dragStart: (event: MouseEvent) => void
          updateRect: () => void
        }
      | null
    >
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

  const updateReact = debounce(() => moveableRef.value?.updateRect(), 300, {
    leading: true,
    trailing: true,
  })

  watch(
    () =>
      editorStore.nodes.map((node) => {
        return node.layout
      }),
    () => {
      updateReact()
    },
    {
      flush: 'post',
    },
  )

  return {
    selectedTarget,
    onSelect,
    onClearSelected,
    onSelectEnd,
  }
}
