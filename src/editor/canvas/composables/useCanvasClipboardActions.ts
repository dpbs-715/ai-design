import type { MaterialSchema } from '@/schema/material.ts'
import type { CanvasPoint } from '@/editor/canvas/contextMenu.ts'
import {
  readEditorClipboardPayload,
  writeEditorNodesToClipboard,
  type ParsedEditorClipboardPayload,
} from '@/editor/canvas/clipboard.ts'
import { useEditorStore } from '@/stores/editor.ts'

const INTERNAL_PASTE_OFFSET = 20

export function useCanvasClipboardActions() {
  const editorStore = useEditorStore()
  let internalClipboardSignature: string | undefined
  let internalPasteCount = 0

  function createNodesSignature(nodes: MaterialSchema[]) {
    return JSON.stringify(nodes)
  }

  function resetInternalPasteSequence(nodes: MaterialSchema[]) {
    internalClipboardSignature = createNodesSignature(nodes)
    internalPasteCount = 0
  }

  function getNextInternalPasteOffset(nodes: MaterialSchema[]) {
    const signature = createNodesSignature(nodes)
    if (signature !== internalClipboardSignature) {
      internalClipboardSignature = signature
      internalPasteCount = 0
    }
    internalPasteCount += 1
    return internalPasteCount * INTERNAL_PASTE_OFFSET
  }

  async function writeNodes(nodes: MaterialSchema[], successMessage: string) {
    if (!nodes.length) return false

    try {
      await writeEditorNodesToClipboard(nodes)
      resetInternalPasteSequence(nodes)
      ElMessage.success(successMessage)
      return true
    } catch {
      ElMessage.error('复制失败，请检查浏览器剪贴板权限')
      return false
    }
  }

  function reportPageMerge(payload: Extract<ParsedEditorClipboardPayload, { kind: 'page' }>) {
    const result = editorStore.mergePage(payload.page)
    if (result.hasEventScripts) {
      ElMessage.warning('页面已合并；事件脚本中引用的节点 ID 可能需要手动调整')
    } else {
      ElMessage.success(`已合并 ${result.nodeCount} 个物料和 ${result.dataSourceCount} 个数据源`)
    }
  }

  async function readPayload() {
    try {
      const payload = await readEditorClipboardPayload()
      if (!payload) ElMessage.warning('剪贴板中没有可识别的设计 JSON')
      return payload
    } catch {
      ElMessage.error('无法读取剪贴板，请检查浏览器权限')
      return null
    }
  }

  async function copyNodes(nodes: MaterialSchema[]) {
    return writeNodes(nodes, `已复制 ${nodes.length} 个物料`)
  }

  async function cutNodes(nodes: MaterialSchema[]) {
    const copied = await writeNodes(nodes, `已剪切 ${nodes.length} 个物料`)
    if (copied) editorStore.removeNodes(nodes.map((node) => node.id))
  }

  async function pasteAt(point: CanvasPoint) {
    const payload = await readPayload()
    if (!payload) return

    if (payload.kind === 'nodes') {
      const count = editorStore.pasteNodes(payload.nodes, { kind: 'point', point })
      if (count) ElMessage.success(`已粘贴 ${count} 个物料`)
      else ElMessage.warning('剪贴板中的节点列表为空')
      return
    }

    reportPageMerge(payload)
  }

  async function pasteFromClipboard() {
    const payload = await readPayload()
    if (!payload) return

    if (payload.kind === 'page') {
      reportPageMerge(payload)
      return
    }

    const placement =
      payload.origin === 'editor'
        ? (() => {
            const offset = getNextInternalPasteOffset(payload.nodes)
            return { kind: 'cascade' as const, x: offset, y: offset }
          })()
        : ({ kind: 'preserve' } as const)
    const count = editorStore.pasteNodes(payload.nodes, placement)
    if (count) ElMessage.success(`已粘贴 ${count} 个物料`)
    else ElMessage.warning('剪贴板中的节点列表为空')
  }

  return {
    copyNodes,
    cutNodes,
    pasteAt,
    pasteFromClipboard,
  }
}
