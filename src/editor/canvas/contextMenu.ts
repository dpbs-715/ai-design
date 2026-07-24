export const canvasContextMenuCommands = {
  duplicate: 'duplicate',
  copy: 'copy',
  paste: 'paste',
  remove: 'remove',
  moveFront: 'moveFront',
  moveBack: 'moveBack',
  toggleSelectionLock: 'toggleSelectionLock',
} as const

export type CanvasContextMenuCommand =
  (typeof canvasContextMenuCommands)[keyof typeof canvasContextMenuCommands]

export interface CanvasPoint {
  x: number
  y: number
}

export interface CanvasInsertionTarget {
  parentId: string
  point: CanvasPoint
}

export type CanvasContextMenuTarget =
  | { kind: 'canvas'; pasteTarget: CanvasInsertionTarget }
  | { kind: 'selection'; nodeIds: string[]; pasteTarget: CanvasInsertionTarget }
  | { kind: 'locked-group'; lockKey: string; pasteTarget: CanvasInsertionTarget }

export type NodeContextMenuTargetKind = Exclude<CanvasContextMenuTarget['kind'], 'canvas'>
