export const nodeContextMenuCommands = {
  copy: 'copy',
  copyJson: 'copyJson',
  remove: 'remove',
  moveFront: 'moveFront',
  moveBack: 'moveBack',
  toggleSelectionLock: 'toggleSelectionLock',
} as const

export type NodeContextMenuCommand =
  (typeof nodeContextMenuCommands)[keyof typeof nodeContextMenuCommands]

export type NodeContextMenuTarget =
  | { kind: 'selection'; nodeIds: string[] }
  | { kind: 'locked-group'; lockKey: string }

export type NodeContextMenuTargetKind = NodeContextMenuTarget['kind']
