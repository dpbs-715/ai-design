<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import {
  getMaterialStyleValue,
  toCssLength,
  useMaterialRootStyle,
} from '@/materials/materialStyle.ts'

defineOptions({
  name: 'ImageMaterial',
})

const props = defineProps<{
  schema: MaterialSchema
}>()

const containerStyle = useMaterialRootStyle(() => props.schema.style, {
  defaults: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 0,
  },
  overrides: () => ({
    borderRadius: toCssLength(getMaterialStyleValue(props.schema.style, 'borderRadius')),
    borderWidth: toCssLength(getMaterialStyleValue(props.schema.style, 'borderWidth')),
  }),
})

const imageStyle = computed(() => {
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
