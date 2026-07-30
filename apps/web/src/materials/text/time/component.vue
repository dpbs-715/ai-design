<script setup lang="ts">
import type { CSSProperties } from 'vue'
import dayjs from 'dayjs'
import RollingNumber from '@/components/RollingNumber/index.vue'
import {
  getMaterialStyleValue,
  toCssLength,
  useMaterialRootStyle,
} from '@/materials/materialStyle.ts'
import type { MaterialSchema } from '@/schema/material.ts'
import {
  createThemeColorReference,
  useRenderTheme,
  type ThemeColorValue,
} from '@/theme/renderTheme.ts'

defineOptions({
  name: 'TimeMaterial',
})

const props = defineProps<{
  schema: MaterialSchema
}>()
const { resolveColor } = useRenderTheme()

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

const now = ref(dayjs())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    now.value = dayjs()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const formatParts = computed(() => {
  const format: string = props.schema.props.format ?? 'YYYY-MM-DD HH:mm:ss'
  const [first, second] = format.split(' ')
  const hasDate = /YYYY|DD/.test(format)
  const hasTime = /HH/.test(format)
  return {
    date: hasDate ? first : '',
    time: hasTime ? (hasDate ? (second ?? '') : first) : '',
  }
})

const dateText = computed(() =>
  formatParts.value.date ? now.value.format(formatParts.value.date) : '',
)

const timeText = computed(() =>
  formatParts.value.time ? now.value.format(formatParts.value.time) : '',
)

const extraText = computed(() => {
  if (!props.schema.props.showWeekday) return ''
  return `星期${WEEKDAY_NAMES[now.value.day()]}`
})

const rollingEnabled = computed(() => props.schema.props.animated !== false)

const containerStyle = useMaterialRootStyle(() => props.schema.style, {
  defaults: { backgroundColor: 'transparent' },
  overrides: () => ({
    padding: toCssLength(getMaterialStyleValue(props.schema.style, 'padding')),
    borderRadius: toCssLength(getMaterialStyleValue(props.schema.style, 'borderRadius')),
  }),
})

const justifyContentMap: Record<string, CSSProperties['justifyContent']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
}

const timeStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}
  const textAlign = getMaterialStyleValue(style, 'textAlign') ?? 'left'
  const color = getMaterialStyleValue<ThemeColorValue>(style, 'color')
  return {
    color: resolveColor(color ?? createThemeColorReference('text-primary')),
    fontFamily: getMaterialStyleValue(style, 'fontFamily') as string | undefined,
    fontSize: toCssLength(getMaterialStyleValue(style, 'fontSize'), 16),
    fontWeight: (getMaterialStyleValue(style, 'fontWeight') ?? 400) as CSSProperties['fontWeight'],
    letterSpacing: toCssLength(getMaterialStyleValue(style, 'letterSpacing')),
    justifyContent: justifyContentMap[String(textAlign)] ?? 'flex-start',
  }
})
</script>

<template>
  <div class="time-material" :style="containerStyle">
    <span class="time-content" :style="timeStyle">
      <RollingNumber v-if="dateText" :value="dateText" :animated="rollingEnabled" />
      <RollingNumber v-if="timeText" :value="timeText" :animated="rollingEnabled" />
      <RollingNumber v-if="extraText" :value="extraText" :animated="rollingEnabled" />
    </span>
  </div>
</template>

<style scoped lang="scss">
.time-material {
  display: flex;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  align-items: center;
  overflow: hidden;
}

.time-content {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.35em;
  overflow: hidden;
  white-space: nowrap;
}
</style>
