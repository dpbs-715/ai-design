import type { CommonFormCommand } from '@vunio/ui'

const MAX_HISTORY_LENGTH = 1000
const COMMAND_MERGE_DELAY = 300
const undoStack = shallowReactive([])
const redoStack = shallowReactive([])
let historyEpoch = 0

export function useUndoRedo() {
  const canUndo = computed(() => undoStack.length > 0)
  const canRedo = computed(() => redoStack.length > 0)

  let activeBatch = null
  let activeBatchEpoch = historyEpoch

  function startBatch() {
    activeBatch = []
    activeBatchEpoch = historyEpoch
  }

  function commitBatch() {
    if (activeBatchEpoch === historyEpoch && activeBatch?.length) {
      pushRecord(activeBatch)
    }
    activeBatch = null
  }

  function pushRecord(record) {
    undoStack.push(record)
    if (undoStack.length > MAX_HISTORY_LENGTH) {
      undoStack.shift()
    }
  }
  function dispatchCommand(command: CommonFormCommand) {
    if (activeBatch && activeBatchEpoch !== historyEpoch) {
      activeBatch = null
    }

    command.execute()

    const previousCommand = activeBatch ? activeBatch.at(-1) : undoStack.at(-1)?.at(-1)

    const merged =
      previousCommand !== undefined &&
      command.createdAt - previousCommand.updatedAt <= COMMAND_MERGE_DELAY &&
      previousCommand.merge(command)

    if (!merged) {
      if (activeBatch) {
        activeBatch.push(command)
      } else {
        pushRecord([command])
      }
    }

    redoStack.length = 0
  }

  function clearHistory() {
    undoStack.length = 0
    redoStack.length = 0
    historyEpoch += 1
    activeBatch = null
  }

  function undo() {
    const commands = undoStack.pop()
    if (!commands) return

    commands.toReversed().forEach((command) => {
      command.undo()
    })

    redoStack.push(commands)
  }

  function redo() {
    const commands = redoStack.pop()
    if (!commands) return

    commands.forEach((command) => {
      command.redo()
    })

    pushRecord(commands)
  }

  return {
    dispatchCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    startBatch,
    commitBatch,
  }
}
