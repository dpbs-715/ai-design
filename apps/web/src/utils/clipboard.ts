export class ClipboardUnavailableError extends Error {
  constructor(action: 'read' | 'write') {
    super(`Clipboard ${action} is not available in the current environment`)
    this.name = 'ClipboardUnavailableError'
  }
}

export async function readClipboardText() {
  if (!navigator.clipboard?.readText) throw new ClipboardUnavailableError('read')
  return navigator.clipboard.readText()
}

export async function writeClipboardText(text: string) {
  if (!navigator.clipboard?.writeText) throw new ClipboardUnavailableError('write')
  await navigator.clipboard.writeText(text)
}
