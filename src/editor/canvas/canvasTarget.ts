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
  acceptsTarget: (parentId: string) => boolean = () => true,
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

  const hitElement = document
    .elementsFromPoint(clientX, clientY)
    .find((element) => stage.contains(element))
  const targetElements: HTMLElement[] = []
  const visitedContainerIds = new Set<string>()
  let container = hitElement?.closest<HTMLElement>('[data-container-id]')

  while (container && stage.contains(container)) {
    const containerId = container.dataset.containerId
    if (!containerId || visitedContainerIds.has(containerId)) break
    visitedContainerIds.add(containerId)
    targetElements.push(container)
    container = container.parentElement?.closest<HTMLElement>('[data-container-id]') ?? null
  }

  targetElements.push(stage)
  const targetElement = targetElements.find((element) =>
    acceptsTarget(element.dataset.containerId ?? rootId),
  )
  if (!targetElement) return null

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
