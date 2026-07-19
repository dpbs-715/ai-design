import type { Ref } from 'vue'

interface CanvasViewportState {
  scale: number
  offset: {
    x: number
    y: number
  }
}

interface CanvasTransform {
  scale: number
  x: number
  y: number
}

interface SketchRulerExpose {
  cursorClass: string
  setTransform: (transform: Partial<CanvasTransform>) => void
}

interface UseCanvasZoomOptions {
  viewportWidth: Readonly<Ref<number>>
  viewportHeight: Readonly<Ref<number>>
  viewportMeasured: Readonly<Ref<boolean>>
  canvasWidth: Readonly<Ref<number>>
  canvasHeight: Readonly<Ref<number>>
  scale: Ref<number>
}

const CANVAS_PADDING_RATIO = 0.2
const FIT_SCALE_TOLERANCE = 0.001
const FIT_OFFSET_TOLERANCE = 0.5

export function useCanvasZoom({
  viewportWidth,
  viewportHeight,
  viewportMeasured,
  canvasWidth,
  canvasHeight,
  scale,
}: UseCanvasZoomOptions) {
  const sketchRulerRef = useTemplateRef<SketchRulerExpose>('sketchRuler')
  const isCanvasPanning = computed(() => {
    const cursorClass = sketchRulerRef.value?.cursorClass
    return cursorClass === 'grab' || cursorClass === 'grabbing'
  })

  function getFitTransform(): CanvasTransform {
    const availableWidth = viewportWidth.value * (1 - CANVAS_PADDING_RATIO)
    const availableHeight = viewportHeight.value * (1 - CANVAS_PADDING_RATIO)
    const fitScale = Math.min(
      availableWidth / canvasWidth.value,
      availableHeight / canvasHeight.value,
    )

    return {
      scale: fitScale,
      x: (viewportWidth.value - canvasWidth.value * fitScale) / 2,
      y: (viewportHeight.value - canvasHeight.value * fitScale) / 2,
    }
  }

  watch(
    viewportMeasured,
    (measured) => {
      if (!measured) return
      scale.value = getFitTransform().scale
    },
    { flush: 'sync', once: true },
  )

  function fitCanvas() {
    sketchRulerRef.value?.setTransform(getFitTransform())
  }

  function centerCanvas() {
    sketchRulerRef.value?.setTransform({
      x: (viewportWidth.value - canvasWidth.value * scale.value) / 2,
      y: (viewportHeight.value - canvasHeight.value * scale.value) / 2,
    })
  }

  function setCanvasScale(nextScale: number) {
    scale.value = nextScale
  }

  function isCanvasFit(state: CanvasViewportState) {
    const fitTransform = getFitTransform()

    return (
      Math.abs(state.scale - fitTransform.scale) < FIT_SCALE_TOLERANCE &&
      Math.abs(state.offset.x - fitTransform.x) < FIT_OFFSET_TOLERANCE &&
      Math.abs(state.offset.y - fitTransform.y) < FIT_OFFSET_TOLERANCE
    )
  }

  return {
    isCanvasPanning,
    fitCanvas,
    centerCanvas,
    setCanvasScale,
    isCanvasFit,
  }
}
