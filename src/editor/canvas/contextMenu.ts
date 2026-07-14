export const nodeContextMenuCommands = {
  copy: 'copy',
  remove: 'remove',
  moveTop: 'moveTop',
  moveBottom: 'moveBottom',
  toggleLock: 'toggleLock',
} as const

export type NodeContextMenuCommand =
  (typeof nodeContextMenuCommands)[keyof typeof nodeContextMenuCommands]
