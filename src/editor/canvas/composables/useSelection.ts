import type { MaterialSchema } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import type { Ref, ShallowRef } from 'vue'

interface UseSelectionOptions {
  stageRef: Readonly<ShallowRef<HTMLElement | null>>
  selectoRef: Readonly<ShallowRef<CanvasSelectoRef | null>>
  moveableRef: Readonly<
    ShallowRef<{
      dragStart: (event: MouseEvent) => void
      updateRect: () => void
    } | null>
  >
  isMoveableActive: Readonly<Ref<boolean>>
}

export interface CanvasSelectoRef {
  setSelectedTargets: (targets: HTMLElement[]) => unknown
}

export function useSelection({
  stageRef,
  selectoRef,
  moveableRef,
  isMoveableActive,
}: UseSelectionOptions) {
  const editorStore = useEditorStore()
  const selectedTarget = shallowRef<HTMLElement[]>([])
  const { nodes, selectedNodeIds } = storeToRefs(editorStore)

  async function onSelect(node: MaterialSchema, event: MouseEvent) {
    if (event.shiftKey) {
      editorStore.toggleNodeSelection(node.id)
      syncSelectedTargets()
      return
    }

    if (!editorStore.isNodeSelected(node.id)) editorStore.selectNode(node.id)

    syncSelectedTargets()
    await nextTick()
    moveableRef.value?.dragStart(event)
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

  function syncSelectedTargets() {
    const stage = stageRef.value
    if (!stage) {
      selectedTarget.value = []
      return
    }

    const movableIds = new Set(editorStore.selectedNodeIds)
    selectedTarget.value = Array.from(stage.querySelectorAll<HTMLElement>('.canvas-node')).filter(
      (element) => movableIds.has(element.dataset.nodeId ?? ''),
    )
    selectoRef.value?.setSelectedTargets(selectedTarget.value)
  }

  watch(
    [nodes, selectedNodeIds],
    async () => {
      await nextTick()
      syncSelectedTargets()
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

  const selectedCanvasRects = computed(() =>
    editorStore.selectedNodeIds.map((id) => editorStore.getNodeCanvasRect(id) ?? null),
  )

  watch(
    selectedCanvasRects,
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
