import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor.ts'

function readThemeColor(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function useCanvasRuler({ moveableRef }) {
  const editorStore = useEditorStore()
  const { canvas } = storeToRefs(editorStore)
  const canvasWidth = computed(() => canvas.value.width)
  const canvasHeight = computed(() => canvas.value.height)

  const scale = ref(1)
  const lines = ref({ h: [], v: [] })
  const palette = {
    bgColor: readThemeColor('--surface-panel'),
    longfgColor: readThemeColor('--border-color-strong'),
    fontColor: readThemeColor('--text-muted'),
    fontShadowColor: readThemeColor('--accent-color'),
    shadowColor: readThemeColor('--accent-soft'),
    lineColor: readThemeColor('--accent-color'),
    lineTYpe: 'solid',
    lockLineColor: readThemeColor('--border-color-strong'),
    borderColor: readThemeColor('--border-color'),
    hoverBg: readThemeColor('--surface-raised'),
    hoverColor: readThemeColor('--text-primary'),
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
