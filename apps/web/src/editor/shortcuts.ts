export interface EditorShortcutLabels {
  save: string
  undo: string
  redo: string
  copy: string
  cut: string
  paste: string
  duplicate: string
  selectAll: string
  remove: string
}

function isApplePlatform() {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

export function getEditorShortcutLabels(): EditorShortcutLabels {
  const applePlatform = isApplePlatform()
  const modifier = applePlatform ? '⌘' : 'Ctrl+'

  return {
    save: `${modifier}S`,
    undo: `${modifier}Z`,
    redo: applePlatform ? '⌘⇧Z' : 'Ctrl+Y',
    copy: `${modifier}C`,
    cut: `${modifier}X`,
    paste: `${modifier}V`,
    duplicate: `${modifier}D`,
    selectAll: `${modifier}A`,
    remove: applePlatform ? '⌫' : 'Del',
  }
}
