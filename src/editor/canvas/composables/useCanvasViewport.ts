import { useRefResizeObserver } from '@/hooks/useRefResizeObserver.ts'
import type { ShallowRef } from 'vue'

const MIN_VIEWPORT_SIZE = 1

export function useCanvasViewport(viewportRef: Readonly<ShallowRef<HTMLDivElement | null>>) {
  const { width: measuredWidth, height: measuredHeight } = useRefResizeObserver(viewportRef)

  const measured = computed(() => measuredWidth.value != null && measuredHeight.value != null)
  const width = computed(() => Math.max(MIN_VIEWPORT_SIZE, measuredWidth.value ?? 0))
  const height = computed(() => Math.max(MIN_VIEWPORT_SIZE, measuredHeight.value ?? 0))

  return {
    width,
    height,
    measured,
  }
}
