import { onBeforeUnmount, onMounted, readonly, shallowRef } from 'vue'
import {
  createChartThemePalette,
  DEFAULT_CHART_ACCENT,
  type ChartThemePalette,
} from '@/materials/charts/palette.ts'

export const CHART_COLOR_MODE_THEME = 'theme'
export const CHART_COLOR_MODE_CUSTOM = 'custom'

const THEME_ACCENT_PROPERTY = '--accent-color'

type ChartOption = Record<string, any>
type ChartThemeStrategy = (option: ChartOption, palette: ChartThemePalette) => ChartOption

function updateFirstSeries(
  option: ChartOption,
  update: (series: ChartOption) => ChartOption,
): ChartOption {
  if (!Array.isArray(option.series) || !option.series.length) return option
  return {
    ...option,
    series: [update(option.series[0]), ...option.series.slice(1)],
  }
}

const chartThemeStrategies: Record<string, ChartThemeStrategy> = {
  'line-chart': (option, palette) =>
    updateFirstSeries({ ...option, color: [palette.accent] }, (series) => ({
      ...series,
      lineStyle: {
        ...series.lineStyle,
        color: palette.accent,
        shadowColor: palette.shadow,
      },
      itemStyle: {
        ...series.itemStyle,
        borderColor: palette.accentLight,
      },
      markPoint: series.markPoint
        ? {
            ...series.markPoint,
            itemStyle: {
              ...series.markPoint.itemStyle,
              color: palette.accent,
            },
          }
        : series.markPoint,
    })),
  'area-chart': (option, palette) =>
    updateFirstSeries({ ...option, color: [palette.accent] }, (series) => ({
      ...series,
      lineStyle: {
        ...series.lineStyle,
        color: palette.accent,
        shadowColor: palette.shadow,
      },
      areaStyle: {
        ...series.areaStyle,
        color: {
          ...series.areaStyle?.color,
          colorStops: [
            { offset: 0, color: palette.areaTop },
            { offset: 1, color: palette.areaBottom },
          ],
        },
      },
    })),
  'bar-chart': (option, palette) =>
    updateFirstSeries({ ...option, color: [palette.accent] }, (series) => ({
      ...series,
      itemStyle: {
        ...series.itemStyle,
        color: {
          ...series.itemStyle?.color,
          colorStops: [
            { offset: 0, color: palette.barTop },
            { offset: 1, color: palette.barBottom },
          ],
        },
      },
      emphasis: {
        ...series.emphasis,
        itemStyle: {
          ...series.emphasis?.itemStyle,
          shadowColor: palette.shadow,
        },
      },
    })),
  'pie-chart': (option, palette) => ({
    ...option,
    color: palette.categorical,
  }),
}

export function usesChartTheme(colorMode: unknown) {
  return colorMode !== CHART_COLOR_MODE_CUSTOM
}

export function applyChartTheme(
  chartType: string,
  option: ChartOption,
  accentColor: string,
): ChartOption {
  const strategy = chartThemeStrategies[chartType]
  return strategy ? strategy(option, createChartThemePalette(accentColor)) : option
}

const themeAccentColor = shallowRef(DEFAULT_CHART_ACCENT)
let themeObserver: MutationObserver | undefined
let themeConsumerCount = 0

function resolveCssColor(color: string) {
  const probe = document.createElement('span')
  probe.style.color = color
  if (!probe.style.color) return ''
  probe.style.display = 'none'
  document.documentElement.append(probe)
  const resolvedColor = getComputedStyle(probe).color
  probe.remove()
  return resolvedColor
}

function syncThemeAccentColor() {
  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue(THEME_ACCENT_PROPERTY)
    .trim()
  themeAccentColor.value = (accentColor && resolveCssColor(accentColor)) || DEFAULT_CHART_ACCENT
}

function observeTheme() {
  if (themeObserver) return
  themeObserver = new MutationObserver(syncThemeAccentColor)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  })
}

export function useChartThemeAccentColor() {
  let active = false

  onMounted(() => {
    if (active) return
    active = true
    themeConsumerCount += 1
    syncThemeAccentColor()
    observeTheme()
  })

  onBeforeUnmount(() => {
    if (!active) return
    active = false
    themeConsumerCount -= 1
    if (themeConsumerCount > 0) return
    themeObserver?.disconnect()
    themeObserver = undefined
  })

  return readonly(themeAccentColor)
}
