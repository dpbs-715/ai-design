import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor.ts'
import type { Ref, ShallowRef } from 'vue'
import { useEditorTheme } from '@/editor/theme/editorTheme.ts'
import type { RulerPalette } from 'vue3-sketch-ruler'

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
  const palette = computed<Partial<RulerPalette>>(() => {
    void resolvedTheme.value

    return {
      bgColor: readThemeColor('--surface-panel'),
      tickColor: readThemeColor('--border-color-strong'),
      labelColor: readThemeColor('--text-muted'),
      shadowColor: readThemeColor('--accent-soft'),
      guideLineColor: readThemeColor('--accent-color'),
      guideLineLockedColor: readThemeColor('--border-color-strong'),
      guideLineStyle: 'solid',
      borderColor: readThemeColor('--border-color'),
      hoverBg: readThemeColor('--surface-raised'),
      hoverColor: readThemeColor('--text-primary'),
    }
  })

  const canvasStyle = computed(() => {
    return {
      width: canvasWidth.value + 'px',
      height: canvasHeight.value + 'px',
    }
  })

  let moveableUpdateFrame: number | undefined

  function updateMoveableRect() {
    if (!isMoveableActive.value) moveableRef.value?.updateRect()
  }

  function onCanvasTransformChange() {
    if (isMoveableActive.value) return
    if (moveableUpdateFrame !== undefined) return

    moveableUpdateFrame = requestAnimationFrame(() => {
      moveableUpdateFrame = undefined
      updateMoveableRect()
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
    updateMoveableRect,
    onCanvasTransformChange,
  }
}
