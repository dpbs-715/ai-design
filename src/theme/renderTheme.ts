import { useEventListener } from '@vunio/hooks'
import type { CSSProperties, InjectionKey, MaybeRefOrGetter, Ref } from 'vue'
import { inject, provide, toValue } from 'vue'

export type RenderThemeMode = 'system' | 'light' | 'dark'
export type ResolvedRenderThemeMode = Exclude<RenderThemeMode, 'system'>

export interface ThemeVariable {
  key: string
  name: string
  type: 'color'
  light: string
  dark: string
  builtin?: boolean
}

export interface RenderThemeConfig {
  mode: RenderThemeMode
  variables: ThemeVariable[]
}

export interface ThemeColorReference {
  type: 'theme'
  key: string
}

export type ThemeColorValue = string | ThemeColorReference

interface RenderThemeContext {
  theme: Readonly<Ref<RenderThemeConfig>>
  resolvedMode: Readonly<Ref<ResolvedRenderThemeMode>>
  rootStyle: Readonly<Ref<CSSProperties>>
  resolveColor: (color: ThemeColorValue | null | undefined, format?: 'css' | 'value') => string
  resolveReferences: <T>(value: T) => T
}

const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'
const CSS_VARIABLE_PREFIX = '--render-theme-'

const defaultThemeVariables: ThemeVariable[] = [
  {
    key: 'primary',
    name: '主题色',
    type: 'color',
    light: '#000',
    dark: '#fff',
    builtin: true,
  },
  {
    key: 'page-background',
    name: '页面背景',
    type: 'color',
    light: '#f5f7fb',
    dark: '#0e0e10',
    builtin: true,
  },
  {
    key: 'container-background',
    name: '容器背景',
    type: 'color',
    light: '#ffffff',
    dark: '#161618',
    builtin: true,
  },
  {
    key: 'text-primary',
    name: '主要文字',
    type: 'color',
    light: '#1f2733',
    dark: '#e6eaf0',
    builtin: true,
  },
  {
    key: 'text-secondary',
    name: '次要文字',
    type: 'color',
    light: '#536071',
    dark: '#a9b3c1',
    builtin: true,
  },
  {
    key: 'text-placeholder',
    name: '提示文字',
    type: 'color',
    light: '#9aa4b2',
    dark: '#697586',
    builtin: true,
  },
  {
    key: 'border',
    name: '边框颜色',
    type: 'color',
    light: '#dde2ea',
    dark: '#2b2b31',
    builtin: true,
  },
  {
    key: 'success',
    name: '成功色',
    type: 'color',
    light: '#22c55e',
    dark: '#34d399',
    builtin: true,
  },
  {
    key: 'warning',
    name: '警告色',
    type: 'color',
    light: '#f59e0b',
    dark: '#fbbf24',
    builtin: true,
  },
  {
    key: 'danger',
    name: '危险色',
    type: 'color',
    light: '#ef4444',
    dark: '#fb7185',
    builtin: true,
  },
]

const renderThemeKey: InjectionKey<RenderThemeContext> = Symbol('render-theme')

export function createDefaultRenderTheme(): RenderThemeConfig {
  return {
    mode: 'system',
    variables: defaultThemeVariables.map((variable) => ({ ...variable })),
  }
}

export function normalizeRenderTheme(theme?: Partial<RenderThemeConfig>): RenderThemeConfig {
  const fallback = createDefaultRenderTheme()
  if (!theme) return fallback

  const mode: RenderThemeMode = ['system', 'light', 'dark'].includes(theme.mode ?? '')
    ? (theme.mode as RenderThemeMode)
    : fallback.mode

  return {
    mode,
    variables: Array.isArray(theme.variables) ? theme.variables : fallback.variables,
  }
}

export function createThemeColorReference(key: string): ThemeColorReference {
  return { type: 'theme', key }
}

export function isThemeColorReference(value: unknown): value is ThemeColorReference {
  if (!value || typeof value !== 'object') return false
  const reference = value as Partial<ThemeColorReference>
  return reference.type === 'theme' && typeof reference.key === 'string'
}

function getCssVariableName(key: string) {
  return `${CSS_VARIABLE_PREFIX}${key}`
}

function resolveThemeVariable(
  reference: ThemeColorReference,
  theme: RenderThemeConfig,
  mode: ResolvedRenderThemeMode,
) {
  return theme.variables.find((variable) => variable.key === reference.key)?.[mode] ?? 'transparent'
}

function isPlainRecord(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function provideRenderTheme(themeSource: MaybeRefOrGetter<RenderThemeConfig | undefined>) {
  const systemMode = ref<ResolvedRenderThemeMode>('light')
  const systemThemeQuery = shallowRef<MediaQueryList>()

  function syncSystemMode(query: MediaQueryList | MediaQueryListEvent) {
    systemMode.value = query.matches ? 'dark' : 'light'
  }

  onMounted(() => {
    systemThemeQuery.value = window.matchMedia(SYSTEM_DARK_QUERY)
    syncSystemMode(systemThemeQuery.value)
  })

  useEventListener<MediaQueryListEvent>(systemThemeQuery, 'change', syncSystemMode)

  const theme = computed(() => normalizeRenderTheme(toValue(themeSource)))
  const resolvedMode = computed<ResolvedRenderThemeMode>(() => {
    return theme.value.mode === 'system' ? systemMode.value : theme.value.mode
  })

  const rootStyle = computed<CSSProperties>(() => {
    return Object.fromEntries(
      theme.value.variables.map((variable) => [
        getCssVariableName(variable.key),
        variable[resolvedMode.value],
      ]),
    )
  })

  function resolveColor(
    color: ThemeColorValue | null | undefined,
    format: 'css' | 'value' = 'css',
  ) {
    if (!isThemeColorReference(color)) return color ?? ''
    if (format === 'value') return resolveThemeVariable(color, theme.value, resolvedMode.value)
    return `var(${getCssVariableName(color.key)}, transparent)`
  }

  function resolveReferences<T>(value: T): T {
    if (isThemeColorReference(value)) return resolveColor(value, 'value') as T
    if (Array.isArray(value)) return value.map(resolveReferences) as T
    if (!value || typeof value !== 'object') return value
    if (!isPlainRecord(value)) return value

    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [key, resolveReferences(childValue)]),
    ) as T
  }

  const context: RenderThemeContext = {
    theme,
    resolvedMode,
    rootStyle,
    resolveColor,
    resolveReferences,
  }

  provide(renderThemeKey, context)
  return context
}

export function useRenderTheme() {
  const context = inject(renderThemeKey)
  if (!context) throw new Error('Render theme context is not available')
  return context
}
