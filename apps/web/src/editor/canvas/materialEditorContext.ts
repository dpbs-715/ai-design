import { createContext } from '@vunio/hooks'
import type { MaterialSchema } from '@/schema/material.ts'

export interface MaterialEditorContext {
  selectedNodeIds: Readonly<Ref<string[]>>
  isNodeLocked(id: string): boolean
  onNodeMouseDown(node: MaterialSchema, event: MouseEvent): void
  insertNode(node: MaterialSchema, parentId: string, index: number): boolean
  reorderChildren(parentId: string, oldIndex: number, newIndex: number): void
}

export const [injectMaterialEditorContext, provideMaterialEditorContext] =
  createContext<MaterialEditorContext>('MaterialEditorContext')
