import type { CanvasInsertionTarget } from '@/editor/canvas/contextMenu.ts'

export interface CanvasDropTarget extends CanvasInsertionTarget {
  width: number
  height: number
}

export function findCanvasDropTarget(
  stage: HTMLElement,
  rootId: string,
  clientX: number,
  clientY: number,
  scale: number,
): CanvasDropTarget | null {
  if (scale <= 0) return null

  const stageRect = stage.getBoundingClientRect()
  if (
    clientX < stageRect.left ||
    clientX > stageRect.right ||
    clientY < stageRect.top ||
    clientY > stageRect.bottom
  ) {
    return null
  }

  let targetElement: HTMLElement = stage
  for (const element of document.elementsFromPoint(clientX, clientY)) {
    const container = element.closest<HTMLElement>('[data-container-id]')
    if (container && stage.contains(container)) {
      targetElement = container
      break
    }
  }

  const rect = targetElement === stage ? stageRect : targetElement.getBoundingClientRect()
  return {
    parentId: targetElement.dataset.containerId ?? rootId,
    point: {
      x: (clientX - rect.left) / scale - targetElement.clientLeft,
      y: (clientY - rect.top) / scale - targetElement.clientTop,
    },
    width: targetElement.clientWidth,
    height: targetElement.clientHeight,
  }
}
