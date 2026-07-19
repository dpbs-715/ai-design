import { computed, nextTick, readonly, ref } from 'vue'

export type EditorThemePreference = 'system' | 'light' | 'dark'
export type ResolvedEditorTheme = Exclude<EditorThemePreference, 'system'>

export interface EditorAccentPreset {
  key: string
  name: string
  seed: string | null
}

export const editorAccentPresets: EditorAccentPreset[] = [
  { key: 'default', name: '默认单色', seed: null },

  { key: 'midnight', name: '夜蓝', seed: '#3F5873' },
  { key: 'amethyst', name: '灰晶紫', seed: '#6F647D' },
  { key: 'deepSea', name: '深海', seed: '#326B68' },
  { key: 'olive', name: '橄榄', seed: '#6E7146' },
  { key: 'bronze', name: '古铜', seed: '#98703C' },
  { key: 'brick', name: '砖红', seed: '#985747' },
  { key: 'burgundy', name: '勃艮第', seed: '#824858' },
]

export interface ThemeTransitionOrigin {
  x: number
  y: number
}

const EDITOR_THEME_STORAGE_KEY = 'ai-design:editor-theme'
const EDITOR_ACCENT_STORAGE_KEY = 'ai-design:editor-accent'
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const THEME_TRANSITION_DURATION = 420

const preference = ref<EditorThemePreference>('system')
const systemTheme = ref<ResolvedEditorTheme>('light')
const resolvedTheme = computed<ResolvedEditorTheme>(() =>
  preference.value === 'system' ? systemTheme.value : preference.value,
)

const accentPreference = ref<string>('default')

const readonlyPreference = readonly(preference)
const readonlyAccentPreference = readonly(accentPreference)
let initialized = false
let darkModeMediaQuery: MediaQueryList | undefined
let accentProbe: HTMLElement | undefined

function isEditorThemePreference(value: string | null): value is EditorThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function isCustomAccentColor(value: string) {
  return /^#[0-9a-f]{3,8}$/i.test(value)
}

function isEditorAccentPreference(value: string | null): value is string {
  return Boolean(
    value &&
    (editorAccentPresets.some((preset) => preset.key === value) || isCustomAccentColor(value)),
  )
}

export function resolveEditorAccentSeed(accentValue: string): string | null {
  const preset = editorAccentPresets.find((candidate) => candidate.key === accentValue)
  if (preset) return preset.seed
  return isCustomAccentColor(accentValue) ? accentValue : null
}

function getAccentProbe() {
  if (!accentProbe) {
    accentProbe = document.createElement('span')
    accentProbe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;'
    document.body.appendChild(accentProbe)
  }
  return accentProbe
}

function resolveAccentPrimaryRgb() {
  const probe = getAccentProbe()
  probe.style.color = 'var(--accent-color)'
  const channels = getComputedStyle(probe)
    .color.match(/\d+(\.\d+)?/g)
    ?.slice(0, 3)
  return channels ? channels.join(', ') : null
}

function applyAccent() {
  const root = document.documentElement
  const seed = resolveEditorAccentSeed(accentPreference.value)

  if (!seed) {
    root.style.removeProperty('--accent-seed')
    root.style.removeProperty('--control-accent-color')
    root.style.removeProperty('--el-color-primary-rgb')
    return
  }

  root.style.setProperty('--accent-seed', seed)
  root.style.setProperty('--control-accent-color', 'var(--accent-color)')

  const primaryRgb = resolveAccentPrimaryRgb()
  if (primaryRgb) root.style.setProperty('--el-color-primary-rgb', primaryRgb)
}

function resolvePreference(nextPreference: EditorThemePreference): ResolvedEditorTheme {
  return nextPreference === 'system' ? systemTheme.value : nextPreference
}

function applyResolvedTheme(theme: ResolvedEditorTheme) {
  const root = document.documentElement
  root.dataset.editorTheme = theme
  root.classList.toggle('dark', theme === 'dark')
  applyAccent()
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

  const storedAccent = localStorage.getItem(EDITOR_ACCENT_STORAGE_KEY)
  accentPreference.value = isEditorAccentPreference(storedAccent) ? storedAccent : 'default'

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

export function setEditorAccentPreference(nextAccent: string) {
  initializeEditorTheme()
  if (!isEditorAccentPreference(nextAccent) || nextAccent === accentPreference.value) return

  accentPreference.value = nextAccent
  applyAccent()
  localStorage.setItem(EDITOR_ACCENT_STORAGE_KEY, nextAccent)
}

export function useEditorTheme() {
  initializeEditorTheme()

  return {
    preference: readonlyPreference,
    resolvedTheme,
    setPreference: setEditorThemePreference,
    accentPreference: readonlyAccentPreference,
    setAccentPreference: setEditorAccentPreference,
  }
}
