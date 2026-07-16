import { useRefResizeObserver } from '@/hooks/useRefResizeObserver.ts'

const MIN_VIEWPORT_SIZE = 1

export function useCanvasViewport() {
  const viewportRef = useTemplateRef<HTMLDivElement>('canvasRoot')
  const { width: measuredWidth, height: measuredHeight } = useRefResizeObserver(viewportRef)

  const width = computed(() => Math.max(MIN_VIEWPORT_SIZE, measuredWidth.value ?? 0))
  const height = computed(() => Math.max(MIN_VIEWPORT_SIZE, measuredHeight.value ?? 0))

  return {
    width,
    height,
  }
}
