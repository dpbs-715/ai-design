import type { MaterialTemplate } from '@/schema/material.ts'

let draggedMaterialTemplate: MaterialTemplate | undefined

export function startMaterialDrag(template: MaterialTemplate) {
  draggedMaterialTemplate = template
}

export function finishMaterialDrag() {
  draggedMaterialTemplate = undefined
}

export function getDraggedMaterialTemplate() {
  return draggedMaterialTemplate
}
