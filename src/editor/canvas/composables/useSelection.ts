import type { MaterialSchema } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'

export function useSelection({ stageRef, moveableRef }) {
  const editorStore = useEditorStore()
  const selectedTarget = shallowRef<HTMLElement[]>()
  const { selectedNodeIds } = storeToRefs(editorStore)

  function onSelect(node: MaterialSchema, e: MouseEvent) {
    editorStore.selectNode(node.id)

    nextTick(() => {
      moveableRef.value.dragStart(e)
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
      selectedTarget.value = ids.map((id) => {
        return stageRef.value.querySelector(`[data-node-id='${id}']:not([data-node-locked='true'])`)
      })
    },
    {
      deep: true,
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
