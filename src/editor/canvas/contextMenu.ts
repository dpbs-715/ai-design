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

export type CanvasContextMenuTarget =
  | { kind: 'canvas'; point: CanvasPoint }
  | { kind: 'selection'; nodeIds: string[]; point: CanvasPoint }
  | { kind: 'locked-group'; lockKey: string; point: CanvasPoint }

export type NodeContextMenuTargetKind = Exclude<CanvasContextMenuTarget['kind'], 'canvas'>
