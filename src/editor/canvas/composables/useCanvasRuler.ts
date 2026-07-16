import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor.ts'
import type { Ref, ShallowRef } from 'vue'
import { useEditorTheme } from '@/editor/theme/editorTheme.ts'

interface UseCanvasRulerOptions {
  moveableRef: Readonly<ShallowRef<{ updateRect: () => void } | null>>
  isMoveableActive: Readonly<Ref<boolean>>
}

function readThemeColor(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function useCanvasRuler({ moveableRef, isMoveableActive }: UseCanvasRulerOptions) {
  const editorStore = useEditorStore()
  const { canvas } = storeToRefs(editorStore)
  const { resolvedTheme } = useEditorTheme()
  const canvasWidth = computed(() => canvas.value.width)
  const canvasHeight = computed(() => canvas.value.height)

  const scale = ref(1)
  const lines = ref({ h: [], v: [] })
  const palette = computed(() => {
    void resolvedTheme.value

    return {
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
  })

  const canvasStyle = computed(() => {
    return {
      width: canvasWidth.value + 'px',
      height: canvasHeight.value + 'px',
      backgroundColor: canvas.value.backgroundColor,
    }
  })

  let moveableUpdateFrame: number | undefined

  const onZoomChange = () => {
    if (isMoveableActive.value) return
    if (moveableUpdateFrame !== undefined) return

    moveableUpdateFrame = requestAnimationFrame(() => {
      moveableUpdateFrame = undefined
      if (!isMoveableActive.value) moveableRef.value?.updateRect()
    })
  }

  onScopeDispose(() => {
    if (moveableUpdateFrame !== undefined) cancelAnimationFrame(moveableUpdateFrame)
  })

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
