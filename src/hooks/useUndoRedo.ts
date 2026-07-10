import type { CommonFormCommand } from '@vunio/ui'

const COMMAND_MERGE_DELAY = 300
const undoStack = shallowReactive([])
const redoStack = shallowReactive([])
export function useUndoRedo() {
  const canUndo = computed(() => undoStack.length > 0)
  const canRedo = computed(() => redoStack.length > 0)

  function dispatchCommand(command: CommonFormCommand) {
    command.execute()

    const previousCommand = undoStack.at(-1)
    const isWithinMergeWindow =
      previousCommand && command.createdAt - previousCommand.updatedAt <= COMMAND_MERGE_DELAY

    if (!isWithinMergeWindow || !previousCommand.merge(command)) {
      undoStack.push(command)
    }

    redoStack.length = 0
  }

  function undo() {
    const command = undoStack.at(-1)
    if (!command) return

    command.undo()
    undoStack.pop()
    redoStack.push(command)
  }

  function redo() {
    const command = redoStack.at(-1)
    if (!command) return

    command.redo()
    redoStack.pop()
    undoStack.push(command)
  }

  return {
    dispatchCommand,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
