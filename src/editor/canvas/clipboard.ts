import type { MaterialSchema } from '@/schema/material.ts'
import type { PageSchema } from '@/schema/page.ts'
import { readClipboardText, writeClipboardText } from '@/utils/clipboard.ts'

const EDITOR_CLIPBOARD_SOURCE = 'ai-design'
const EDITOR_CLIPBOARD_VERSION = 1

export type EditorClipboardPayload =
  | {
      source: typeof EDITOR_CLIPBOARD_SOURCE
      version: typeof EDITOR_CLIPBOARD_VERSION
      kind: 'nodes'
      nodes: MaterialSchema[]
    }
  | {
      source: typeof EDITOR_CLIPBOARD_SOURCE
      version: typeof EDITOR_CLIPBOARD_VERSION
      kind: 'page'
      page: PageSchema
    }

export type ParsedEditorClipboardPayload = EditorClipboardPayload & {
  origin: 'editor' | 'external'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isMaterialSchema(value: unknown): value is MaterialSchema {
  if (!isRecord(value) || !isRecord(value.layout) || !isRecord(value.props)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.layout.x) &&
    isFiniteNumber(value.layout.y) &&
    isFiniteNumber(value.layout.width) &&
    isFiniteNumber(value.layout.height)
  )
}

function isThemeVariable(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    typeof value.name === 'string' &&
    value.type === 'color' &&
    typeof value.light === 'string' &&
    typeof value.dark === 'string'
  )
}

function isDataSourceSchema(value: unknown) {
  return (
    isRecord(value) &&
    (value.type === 'static' || value.type === 'api') &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    'data' in value
  )
}

function isPageSchema(value: unknown): value is PageSchema {
  if (!isRecord(value) || !isRecord(value.canvas) || !isRecord(value.theme)) return false

  return (
    isFiniteNumber(value.canvas.width) &&
    isFiniteNumber(value.canvas.height) &&
    ['system', 'light', 'dark'].includes(String(value.theme.mode)) &&
    Array.isArray(value.theme.variables) &&
    value.theme.variables.every(isThemeVariable) &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isMaterialSchema) &&
    Array.isArray(value.dataSources) &&
    value.dataSources.every(isDataSourceSchema)
  )
}

function createNodesPayload(nodes: MaterialSchema[]): EditorClipboardPayload {
  return {
    source: EDITOR_CLIPBOARD_SOURCE,
    version: EDITOR_CLIPBOARD_VERSION,
    kind: 'nodes',
    nodes,
  }
}

export function parseEditorClipboardText(text: string): ParsedEditorClipboardPayload | null {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return null
  }

  // Keep manual JSON workflows convenient while all editor-generated copies use the envelope.
  if (Array.isArray(value) && value.every(isMaterialSchema)) {
    return { ...createNodesPayload(value), origin: 'external' }
  }
  if (isMaterialSchema(value)) {
    return { ...createNodesPayload([value]), origin: 'external' }
  }
  if (isPageSchema(value)) {
    return {
      source: EDITOR_CLIPBOARD_SOURCE,
      version: EDITOR_CLIPBOARD_VERSION,
      kind: 'page',
      page: value,
      origin: 'external',
    }
  }

  if (
    !isRecord(value) ||
    value.source !== EDITOR_CLIPBOARD_SOURCE ||
    value.version !== EDITOR_CLIPBOARD_VERSION
  ) {
    return null
  }

  if (value.kind === 'nodes' && Array.isArray(value.nodes) && value.nodes.every(isMaterialSchema)) {
    return { ...createNodesPayload(value.nodes), origin: 'editor' }
  }
  if (value.kind === 'page' && isPageSchema(value.page)) {
    return {
      source: EDITOR_CLIPBOARD_SOURCE,
      version: EDITOR_CLIPBOARD_VERSION,
      kind: 'page',
      page: value.page,
      origin: 'editor',
    }
  }
  return null
}

export async function writeEditorNodesToClipboard(nodes: MaterialSchema[]) {
  await writeClipboardText(JSON.stringify(createNodesPayload(nodes), null, 2))
}

export async function readEditorClipboardPayload() {
  return parseEditorClipboardText(await readClipboardText())
}
