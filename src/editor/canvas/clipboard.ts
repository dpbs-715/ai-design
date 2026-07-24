import type { MaterialSchema } from '@/schema/material.ts'
import type { PageSchema } from '@/schema/page.ts'
import {
  parseMaterialNodesSchema,
  parseMaterialSchema,
  parsePageSchema,
} from '@/schema/validation.ts'
import { readClipboardText, writeClipboardText } from '@/utils/clipboard.ts'

const EDITOR_CLIPBOARD_SOURCE = 'ai-design'
const EDITOR_CLIPBOARD_VERSION = 2

export type EditorClipboardPayload =
  | {
      source: typeof EDITOR_CLIPBOARD_SOURCE
      version: typeof EDITOR_CLIPBOARD_VERSION
      kind: 'nodes'
      nodes: MaterialSchema[]
      parentId?: string
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

function createNodesPayload(nodes: MaterialSchema[], parentId?: string): EditorClipboardPayload {
  return {
    source: EDITOR_CLIPBOARD_SOURCE,
    version: EDITOR_CLIPBOARD_VERSION,
    kind: 'nodes',
    nodes,
    parentId,
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
  const externalNodesResult = parseMaterialNodesSchema(value)
  if (externalNodesResult.success) {
    return { ...createNodesPayload(externalNodesResult.data), origin: 'external' }
  }
  const externalNodeResult = parseMaterialSchema(value)
  if (externalNodeResult.success) {
    return { ...createNodesPayload([externalNodeResult.data]), origin: 'external' }
  }
  const externalPageResult = parsePageSchema(value)
  if (externalPageResult.success) {
    return {
      source: EDITOR_CLIPBOARD_SOURCE,
      version: EDITOR_CLIPBOARD_VERSION,
      kind: 'page',
      page: externalPageResult.data,
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

  const editorNodesResult =
    value.kind === 'nodes' ? parseMaterialNodesSchema(value.nodes) : undefined
  if (editorNodesResult?.success) {
    return {
      ...createNodesPayload(
        editorNodesResult.data,
        typeof value.parentId === 'string' ? value.parentId : undefined,
      ),
      origin: 'editor',
    }
  }
  const editorPageResult = value.kind === 'page' ? parsePageSchema(value.page) : undefined
  if (editorPageResult?.success) {
    return {
      source: EDITOR_CLIPBOARD_SOURCE,
      version: EDITOR_CLIPBOARD_VERSION,
      kind: 'page',
      page: editorPageResult.data,
      origin: 'editor',
    }
  }
  return null
}

export async function writeEditorNodesToClipboard(nodes: MaterialSchema[], parentId?: string) {
  await writeClipboardText(JSON.stringify(createNodesPayload(nodes, parentId), null, 2))
}

export async function readEditorClipboardPayload() {
  return parseEditorClipboardText(await readClipboardText())
}
