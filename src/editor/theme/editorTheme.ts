import { computed, nextTick, readonly, ref } from 'vue'

export type EditorThemePreference = 'system' | 'light' | 'dark'
export type ResolvedEditorTheme = Exclude<EditorThemePreference, 'system'>

export interface ThemeTransitionOrigin {
  x: number
  y: number
}

const EDITOR_THEME_STORAGE_KEY = 'ai-design:editor-theme'
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const THEME_TRANSITION_DURATION = 420

const preference = ref<EditorThemePreference>('system')
const systemTheme = ref<ResolvedEditorTheme>('light')
const resolvedTheme = computed<ResolvedEditorTheme>(() =>
  preference.value === 'system' ? systemTheme.value : preference.value,
)

const readonlyPreference = readonly(preference)
let initialized = false
let darkModeMediaQuery: MediaQueryList | undefined

function isEditorThemePreference(value: string | null): value is EditorThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function resolvePreference(nextPreference: EditorThemePreference): ResolvedEditorTheme {
  return nextPreference === 'system' ? systemTheme.value : nextPreference
}

function applyResolvedTheme(theme: ResolvedEditorTheme) {
  const root = document.documentElement
  root.dataset.editorTheme = theme
  root.classList.toggle('dark', theme === 'dark')
}

function savePreference(nextPreference: EditorThemePreference) {
  localStorage.setItem(EDITOR_THEME_STORAGE_KEY, nextPreference)
}

function updatePreference(
  nextPreference: EditorThemePreference,
  nextResolvedTheme: ResolvedEditorTheme,
) {
  preference.value = nextPreference
  applyResolvedTheme(nextResolvedTheme)
  savePreference(nextPreference)
}

function getTransitionClipPathKeyframes({ x, y }: ThemeTransitionOrigin) {
  const furthestX = Math.max(x, window.innerWidth - x)
  const furthestY = Math.max(y, window.innerHeight - y)
  const endRadius = Math.hypot(furthestX, furthestY)

  // Relative values keep the reveal anchored when a high-DPI snapshot uses a scaled coordinate space.
  const centerXPercent = (100 * x) / window.innerWidth
  const centerYPercent = (100 * y) / window.innerHeight
  const radiusReference = Math.hypot(window.innerWidth, window.innerHeight) / Math.SQRT2
  const radiusPercent = (100 * endRadius) / radiusReference

  return [
    `circle(0% at ${centerXPercent}% ${centerYPercent}%)`,
    `circle(${radiusPercent}% at ${centerXPercent}% ${centerYPercent}%)`,
  ]
}

function supportsAnimatedThemeTransition(origin?: ThemeTransitionOrigin) {
  return Boolean(
    origin && document.startViewTransition && !window.matchMedia(REDUCED_MOTION_QUERY).matches,
  )
}

export function initializeEditorTheme() {
  if (initialized) return

  darkModeMediaQuery = window.matchMedia(DARK_MODE_QUERY)
  systemTheme.value = darkModeMediaQuery.matches ? 'dark' : 'light'

  const storedPreference = localStorage.getItem(EDITOR_THEME_STORAGE_KEY)
  preference.value = isEditorThemePreference(storedPreference) ? storedPreference : 'system'
  applyResolvedTheme(resolvedTheme.value)

  darkModeMediaQuery.addEventListener('change', (event) => {
    systemTheme.value = event.matches ? 'dark' : 'light'
    if (preference.value === 'system') applyResolvedTheme(systemTheme.value)
  })

  initialized = true
}

export async function setEditorThemePreference(
  nextPreference: EditorThemePreference,
  origin?: ThemeTransitionOrigin,
) {
  initializeEditorTheme()
  if (nextPreference === preference.value) return

  const previousResolvedTheme = resolvedTheme.value
  const nextResolvedTheme = resolvePreference(nextPreference)
  const update = async () => {
    updatePreference(nextPreference, nextResolvedTheme)
    await nextTick()
  }

  if (previousResolvedTheme === nextResolvedTheme || !supportsAnimatedThemeTransition(origin)) {
    await update()
    return
  }

  const transition = document.startViewTransition(update)

  try {
    await transition.ready
    document.documentElement.animate(
      {
        clipPath: getTransitionClipPathKeyframes(origin!),
      },
      {
        duration: THEME_TRANSITION_DURATION,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  } catch {
    await update()
  }
}

export function useEditorTheme() {
  initializeEditorTheme()

  return {
    preference: readonlyPreference,
    resolvedTheme,
    setPreference: setEditorThemePreference,
  }
}
