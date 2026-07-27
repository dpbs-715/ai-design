<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import {
  getMaterialStyleValue,
  toCssLength,
  useMaterialRootStyle,
} from '@/materials/materialStyle.ts'
import {
  createThemeColorReference,
  useRenderTheme,
  type ThemeColorValue,
} from '@/theme/renderTheme.ts'

defineOptions({
  name: 'TextMaterial',
})

const props = defineProps<{
  schema: MaterialSchema
}>()
const { resolveColor } = useRenderTheme()

const TEXT_SHADOW = '0 8px 24px rgba(7, 10, 24, 0.42), 0 1px 2px rgba(7, 10, 24, 0.7)'

const containerStyle = useMaterialRootStyle(() => props.schema.style, {
  defaults: { backgroundColor: 'transparent' },
  overrides: () => ({
    justifyContent: props.schema.props.verticalAlign ?? 'center',
    padding: toCssLength(getMaterialStyleValue(props.schema.style, 'padding')),
    borderRadius: toCssLength(getMaterialStyleValue(props.schema.style, 'borderRadius')),
  }),
})

const textStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}
  const textProps = props.schema.props
  const wrap = textProps.wrap !== false
  const color = getMaterialStyleValue<ThemeColorValue>(style, 'color')

  return {
    color: resolveColor(color ?? createThemeColorReference('text-primary')),
    fontFamily: getMaterialStyleValue(style, 'fontFamily') as string | undefined,
    fontSize: toCssLength(getMaterialStyleValue(style, 'fontSize'), 16),
    fontWeight: (getMaterialStyleValue(style, 'fontWeight') ?? 400) as CSSProperties['fontWeight'],
    fontStyle: textProps.italic ? 'italic' : 'normal',
    lineHeight: (getMaterialStyleValue(style, 'lineHeight') ?? 1.4) as CSSProperties['lineHeight'],
    letterSpacing: toCssLength(getMaterialStyleValue(style, 'letterSpacing')),
    textAlign: (getMaterialStyleValue(style, 'textAlign') ?? 'left') as CSSProperties['textAlign'],
    textDecoration: textProps.underline ? 'underline' : 'none',
    textShadow: textProps.shadow ? TEXT_SHADOW : 'none',
    whiteSpace: wrap ? 'pre-wrap' : 'nowrap',
    textOverflow: wrap ? 'clip' : 'ellipsis',
  }
})
</script>

<template>
  <div class="text-material" :style="containerStyle">
    <span class="text-content" :style="textStyle">{{ schema.props.content }}</span>
  </div>
</template>

<style scoped lang="scss">
.text-material {
  display: flex;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  flex-direction: column;
  overflow: hidden;
}

.text-content {
  display: block;
  width: 100%;
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
