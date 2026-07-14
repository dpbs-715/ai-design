export const DEFAULT_CHART_ACCENT = '#7b8cff'

interface RgbColor {
  red: number
  green: number
  blue: number
}

interface HslColor {
  hue: number
  saturation: number
  lightness: number
}

export interface ChartThemePalette {
  accent: string
  accentLight: string
  barTop: string
  barBottom: string
  shadow: string
  areaTop: string
  areaBottom: string
  categorical: string[]
}

function clamp(value: number, min = 0, max = 255) {
  return Math.min(Math.max(value, min), max)
}

function parseHexColor(color: string): RgbColor | null {
  const hex = color.trim().replace(/^#/, '')
  if (![3, 6].includes(hex.length) || !/^[\da-f]+$/i.test(hex)) return null

  const normalized = hex.length === 3 ? [...hex].map((part) => part + part).join('') : hex
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function parseRgbColor(color: string): RgbColor | null {
  const match = color.trim().match(/^rgba?\((.+)\)$/i)
  if (!match) return null

  const channels = match[1].split('/')[0].replaceAll(',', ' ').trim().split(/\s+/).slice(0, 3)
  if (channels.length !== 3) return null

  const parsedChannels = channels.map((channel) => {
    const value = Number.parseFloat(channel)
    return channel.endsWith('%') ? (value / 100) * 255 : value
  })
  if (parsedChannels.some((channel) => !Number.isFinite(channel))) return null

  return {
    red: clamp(Math.round(parsedChannels[0])),
    green: clamp(Math.round(parsedChannels[1])),
    blue: clamp(Math.round(parsedChannels[2])),
  }
}

function parseCssColor(color: string) {
  return parseHexColor(color) ?? parseRgbColor(color)
}

function toHex({ red, green, blue }: RgbColor) {
  return `#${[red, green, blue]
    .map((channel) => clamp(Math.round(channel)).toString(16).padStart(2, '0'))
    .join('')}`
}

function withAlpha(color: RgbColor, alpha: number) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`
}

function mix(color: RgbColor, target: RgbColor, amount: number): RgbColor {
  return {
    red: color.red + (target.red - color.red) * amount,
    green: color.green + (target.green - color.green) * amount,
    blue: color.blue + (target.blue - color.blue) * amount,
  }
}

function toHsl({ red, green, blue }: RgbColor): HslColor {
  const [r, g, b] = [red, green, blue].map((channel) => channel / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) return { hue: 0, saturation: 0, lightness }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (max === r) hue = 60 * (((g - b) / delta) % 6)
  if (max === g) hue = 60 * ((b - r) / delta + 2)
  if (max === b) hue = 60 * ((r - g) / delta + 4)

  return { hue: (hue + 360) % 360, saturation, lightness }
}

function fromHsl({ hue, saturation, lightness }: HslColor): RgbColor {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const hueSection = (((hue % 360) + 360) % 360) / 60
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1))
  const offset = lightness - chroma / 2
  const channels =
    hueSection < 1
      ? [chroma, secondary, 0]
      : hueSection < 2
        ? [secondary, chroma, 0]
        : hueSection < 3
          ? [0, chroma, secondary]
          : hueSection < 4
            ? [0, secondary, chroma]
            : hueSection < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary]

  return {
    red: (channels[0] + offset) * 255,
    green: (channels[1] + offset) * 255,
    blue: (channels[2] + offset) * 255,
  }
}

function createCategoricalPalette(accent: RgbColor) {
  const { hue } = toHsl(accent)
  const variants: HslColor[] = [
    { hue: hue + 38, saturation: 0.78, lightness: 0.69 },
    { hue: hue + 168, saturation: 0.84, lightness: 0.64 },
    { hue: hue + 104, saturation: 0.76, lightness: 0.66 },
    { hue: hue - 42, saturation: 0.72, lightness: 0.62 },
  ]

  return [toHex(accent), ...variants.map((variant) => toHex(fromHsl(variant)))]
}

export function createChartThemePalette(accentColor: string): ChartThemePalette {
  const accent = parseCssColor(accentColor) ?? parseHexColor(DEFAULT_CHART_ACCENT)!
  const white = { red: 255, green: 255, blue: 255 }
  const black = { red: 0, green: 0, blue: 0 }

  return {
    accent: toHex(accent),
    accentLight: toHex(mix(accent, white, 0.22)),
    barTop: toHex(mix(accent, white, 0.08)),
    barBottom: toHex(mix(accent, black, 0.32)),
    shadow: withAlpha(accent, 0.28),
    areaTop: withAlpha(accent, 0.48),
    areaBottom: withAlpha(accent, 0.02),
    categorical: createCategoricalPalette(accent),
  }
}
