import { useEventListener } from '@vunio/hooks'
import {
  isThemeColorReference,
  normalizeRenderTheme,
  type RenderThemeConfig,
  type ResolvedRenderThemeMode,
  type ThemeColorReference,
  type ThemeColorValue,
} from '@ai-design/contracts/theme'
import type { CSSProperties, InjectionKey, MaybeRefOrGetter, Ref } from 'vue'
import { inject, provide, toValue } from 'vue'

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

const renderThemeKey: InjectionKey<RenderThemeContext> = Symbol('render-theme')

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
