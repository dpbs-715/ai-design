<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'

defineOptions({
  name: 'TextMaterial',
})

const props = defineProps<{
  schema: MaterialSchema
}>()

const containerStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}
  return {
    justifyContent: props.schema.props.verticalAlign ?? 'center',
    backgroundColor: style.backgroundColor ?? 'transparent',
    padding: `${style.padding ?? 0}px`,
    borderRadius: `${style.borderRadius ?? 0}px`,
  }
})

const textStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}
  const textProps = props.schema.props
  const wrap = textProps.wrap !== false

  return {
    color: style.color ?? '#ffffff',
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize ?? 16}px`,
    fontWeight: style.fontWeight ?? 400,
    fontStyle: textProps.italic ? 'italic' : 'normal',
    lineHeight: style.lineHeight ?? 1.4,
    letterSpacing: `${style.letterSpacing ?? 0}px`,
    textAlign: style.textAlign ?? 'left',
    textDecoration: textProps.underline ? 'underline' : 'none',
    textShadow: textProps.shadow
      ? '0 8px 24px rgba(7, 10, 24, 0.42), 0 1px 2px rgba(7, 10, 24, 0.7)'
      : 'none',
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
