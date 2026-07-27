import { camelToKebab } from '@vunio/utils'
import { computed, toValue, type CSSProperties, type MaybeRefOrGetter } from 'vue'
import { isThemeColorReference, useRenderTheme } from '@/theme/renderTheme.ts'

type MaterialStyleSource = Record<string, unknown> | null | undefined

interface MaterialRootStyleOptions {
  defaults?: MaybeRefOrGetter<MaterialStyleSource>
  overrides?: MaybeRefOrGetter<MaterialStyleSource>
}

const placementStyleKeys = new Set(['position', 'left', 'top', 'width', 'height', 'transform'])

function toCssPropertyName(property: string) {
  if (property.startsWith('-')) return property
  if (property === 'cssFloat') return 'float'

  const kebabProperty = camelToKebab(property)
  return /^(webkit|moz|ms|o)-/.test(kebabProperty) ? `-${kebabProperty}` : kebabProperty
}

export function getMaterialStyleValue<T = unknown>(
  style: MaterialStyleSource,
  property: string,
): T | undefined {
  if (!style) return
  if (Object.hasOwn(style, property)) return style[property] as T

  const cssProperty = toCssPropertyName(property)
  const matchedEntry = Object.entries(style).find(([key]) => toCssPropertyName(key) === cssProperty)
  return matchedEntry?.[1] as T | undefined
}

export function toCssLength(value: unknown, fallback: number | string = 0) {
  const length = value ?? fallback
  return typeof length === 'number' ? `${length}px` : String(length)
}

export function useMaterialRootStyle(
  source: MaybeRefOrGetter<MaterialStyleSource>,
  options: MaterialRootStyleOptions = {},
) {
  const { resolveColor } = useRenderTheme()

  function resolveStyleValue(value: unknown): unknown {
    if (isThemeColorReference(value)) return resolveColor(value)
    if (Array.isArray(value)) return value.map(resolveStyleValue)
    return value
  }

  return computed<CSSProperties>(() => {
    const style = {
      ...toValue(options.defaults),
      ...toValue(source),
      ...toValue(options.overrides),
    }

    return Object.fromEntries(
      Object.entries(style).flatMap(([key, value]) => {
        const cssProperty = toCssPropertyName(key)
        if (placementStyleKeys.has(cssProperty) || value == null) return []
        return [[cssProperty, resolveStyleValue(value)]]
      }),
    ) as CSSProperties
  })
}
