import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor.ts'

export function useCanvasRuler({ moveableRef }) {
  const editorStore = useEditorStore()
  const { canvas } = storeToRefs(editorStore)
  const canvasWidth = toRef(canvas.value, 'width')
  const canvasHeight = toRef(canvas.value, 'height')

  const scale = ref(1)
  const lines = ref({ h: [], v: [] })
  const palette = {
    bgColor: '#1f2937',
    longfgColor: '#6b7280',
    fontColor: '#9ca3af',
    fontShadowColor: '#0e8da7',
    shadowColor: 'rgba(14,141,167,0.14)',
    lineColor: '#22c55e',
    lineTYpe: 'solid',
    lockLineColor: '#4b5563',
    borderColor: '#374151',
    hoverBg: '#111827',
    hoverColor: '#ffffff',
  }

  const canvasStyle = computed(() => {
    return {
      width: canvasWidth.value + 'px',
      height: canvasHeight.value + 'px',
      backgroundColor: canvas.value.backgroundColor,
    }
  })

  const onZoomChange = () => {
    moveableRef.value.updateRect()
  }
  return {
    canvasWidth,
    canvasHeight,
    canvasStyle,
    scale,
    lines,
    palette,
    onZoomChange,
  }
}
