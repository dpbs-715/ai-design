export function useUndoRedo() {
  const undoStack = ref<any[]>([])
  const redoStack = ref<any[]>([])

  function undo() {}
  function redo() {}

  return {
    undo,
    redo,
  }
}
