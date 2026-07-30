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
