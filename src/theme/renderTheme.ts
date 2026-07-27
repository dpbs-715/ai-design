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
  extensions?: Record<string, any>
}

export interface RenderThemeConfig {
  mode: RenderThemeMode
  variables: ThemeVariable[]
  extensions?: Record<string, any>
}

export interface ThemeColorReference {
  type: 'theme'
  key: string
  extensions?: Record<string, any>
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

function renderThemeVariable(key: string) {
  return `var(${CSS_VARIABLE_PREFIX}${key}, transparent)`
}

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

  const configuredVariables = Array.isArray(theme.variables) ? theme.variables : []
  const configuredByKey = new Map(
    configuredVariables.map((variable) => [variable.key, variable] as const),
  )
  const builtinKeys = new Set(fallback.variables.map((variable) => variable.key))
  const variables = [
    ...fallback.variables.map((variable) => ({
      ...variable,
      ...configuredByKey.get(variable.key),
    })),
    ...configuredVariables
      .filter((variable) => !builtinKeys.has(variable.key))
      .map((variable) => ({ ...variable })),
  ]

  return {
    mode,
    variables,
    ...(theme.extensions ? { extensions: { ...theme.extensions } } : {}),
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

  if (typeof window !== 'undefined') {
    systemThemeQuery.value = window.matchMedia(SYSTEM_DARK_QUERY)
    syncSystemMode(systemThemeQuery.value)
  }

  useEventListener<MediaQueryListEvent>(systemThemeQuery, 'change', syncSystemMode)

  const theme = computed(() => normalizeRenderTheme(toValue(themeSource)))
  const resolvedMode = computed<ResolvedRenderThemeMode>(() => {
    return theme.value.mode === 'system' ? systemMode.value : theme.value.mode
  })

  const rootStyle = computed<CSSProperties>(() => {
    const renderThemeVariables = Object.fromEntries(
      theme.value.variables.map((variable) => [
        getCssVariableName(variable.key),
        variable[resolvedMode.value],
      ]),
    )

    const primary = renderThemeVariable('primary')
    const pageBackground = renderThemeVariable('page-background')
    const containerBackground = renderThemeVariable('container-background')
    const textPrimary = renderThemeVariable('text-primary')
    const textSecondary = renderThemeVariable('text-secondary')
    const textPlaceholder = renderThemeVariable('text-placeholder')
    const border = renderThemeVariable('border')

    return {
      ...renderThemeVariables,
      colorScheme: resolvedMode.value,
      '--el-color-primary': primary,
      '--el-color-success': renderThemeVariable('success'),
      '--el-color-warning': renderThemeVariable('warning'),
      '--el-color-danger': renderThemeVariable('danger'),
      '--el-color-primary-light-3': `color-mix(in srgb, ${primary} 70%, ${containerBackground})`,
      '--el-color-primary-light-5': `color-mix(in srgb, ${primary} 50%, ${containerBackground})`,
      '--el-color-primary-light-7': `color-mix(in srgb, ${primary} 30%, ${containerBackground})`,
      '--el-color-primary-light-8': `color-mix(in srgb, ${primary} 20%, ${containerBackground})`,
      '--el-color-primary-light-9': `color-mix(in srgb, ${primary} 10%, ${containerBackground})`,
      '--el-color-primary-dark-2': `color-mix(in srgb, ${primary} 82%, ${pageBackground})`,
      '--el-bg-color': containerBackground,
      '--el-bg-color-page': pageBackground,
      '--el-bg-color-overlay': containerBackground,
      '--el-fill-color-darker': `color-mix(in srgb, ${pageBackground} 82%, ${border})`,
      '--el-fill-color-dark': `color-mix(in srgb, ${pageBackground} 88%, ${border})`,
      '--el-fill-color': `color-mix(in srgb, ${pageBackground} 72%, ${containerBackground})`,
      '--el-fill-color-light': `color-mix(in srgb, ${pageBackground} 58%, ${containerBackground})`,
      '--el-fill-color-lighter': `color-mix(in srgb, ${pageBackground} 38%, ${containerBackground})`,
      '--el-fill-color-extra-light': `color-mix(in srgb, ${pageBackground} 20%, ${containerBackground})`,
      '--el-fill-color-blank': containerBackground,
      '--el-border-color': border,
      '--el-border': `var(--el-border-width) var(--el-border-style) ${border}`,
      '--el-border-color-light': `color-mix(in srgb, ${border} 82%, transparent)`,
      '--el-border-color-lighter': `color-mix(in srgb, ${border} 62%, transparent)`,
      '--el-border-color-extra-light': `color-mix(in srgb, ${border} 42%, transparent)`,
      '--el-border-color-dark': border,
      '--el-border-color-darker': `color-mix(in srgb, ${border} 82%, ${textSecondary})`,
      '--el-border-color-hover': textPlaceholder,
      '--el-text-color-primary': textPrimary,
      '--el-text-color-regular': textSecondary,
      '--el-text-color-secondary': textPlaceholder,
      '--el-text-color-placeholder': textPlaceholder,
      '--el-text-color-disabled': `color-mix(in srgb, ${textPlaceholder} 58%, transparent)`,
      '--el-disabled-bg-color': `color-mix(in srgb, ${pageBackground} 58%, ${containerBackground})`,
      '--el-disabled-text-color': textPlaceholder,
      '--el-disabled-border-color': border,
    }
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
