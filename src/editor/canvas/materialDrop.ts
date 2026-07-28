import { canMaterialAcceptChild, createNode, getMaterialDefinition } from '@/materials'
import {
  isAbsolutePlacement,
  isFormItemPlacement,
  type MaterialSchema,
  type MaterialTemplate,
} from '@/schema/material.ts'
import type { CanvasDropTarget } from '@/editor/canvas/canvasTarget.ts'

const autoFormContainerType = 'business-form'

export interface CanvasDropNode {
  node: MaterialSchema
  selectedNodeId: string
}

export function getCanvasDropType(template: MaterialTemplate) {
  return isFormItemPlacement(template.placement) ? autoFormContainerType : template.type
}

export function createCanvasDropNode(template: MaterialTemplate): CanvasDropNode | undefined {
  const node = createNode(template)
  if (!isFormItemPlacement(node.placement)) {
    return { node, selectedNodeId: node.id }
  }

  const formTemplate = getMaterialDefinition(autoFormContainerType)?.schema
  if (!formTemplate) return

  const formNode = createNode(formTemplate)
  if (!isAbsolutePlacement(formNode.placement) || !canMaterialAcceptChild(formNode, node)) return

  formNode.children = [node]
  return { node: formNode, selectedNodeId: node.id }
}

export function placeCanvasDropNode(node: MaterialSchema, dropTarget: CanvasDropTarget) {
  if (!isAbsolutePlacement(node.placement)) return false

  const x = dropTarget.point.x - node.placement.width / 2
  const y = dropTarget.point.y - node.placement.height / 2
  node.placement.x = Math.min(Math.max(x, 0), Math.max(dropTarget.width - node.placement.width, 0))
  node.placement.y = Math.min(
    Math.max(y, 0),
    Math.max(dropTarget.height - node.placement.height, 0),
  )
  return true
}
