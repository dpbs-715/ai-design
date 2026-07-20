<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'

defineOptions({
  name: 'ImageMaterial',
})

const props = defineProps<{
  schema: MaterialSchema
}>()
const { resolveColor } = useRenderTheme()

const containerStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}
  const borderWidth = style.borderWidth ?? 0
  return {
    backgroundColor: resolveColor(style.backgroundColor) || 'transparent',
    borderRadius: `${style.borderRadius ?? 0}px`,
    border: borderWidth
      ? `${borderWidth}px solid ${resolveColor(style.borderColor) || 'transparent'}`
      : 'none',
  }
})

const imageStyle = computed<CSSProperties>(() => {
  const imageProps = props.schema.props
  return {
    objectFit: imageProps.fit ?? 'cover',
    opacity: imageProps.opacity ?? 1,
  }
})
</script>

<template>
  <div class="image-material" :style="containerStyle">
    <img
      v-if="schema.props.src"
      class="image-content"
      :src="schema.props.src"
      :alt="schema.props.alt || schema.name"
      :style="imageStyle"
      draggable="false"
    />
    <div v-else class="image-empty" :style="imageStyle">
      <Icon icon="fluent:image-20-regular" width="28" />
      <span>未设置图片</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.image-material {
  display: flex;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.image-content {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
}

.image-empty {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
}
</style>
