<script setup lang="ts">
defineOptions({ name: 'AnnotationFrameMaterialPreview' })

withDefaults(
  defineProps<{
    color?: string
    label?: string
    dashed?: boolean
  }>(),
  {
    color: '#3978f6',
    label: '标注',
    dashed: false,
  },
)
</script>

<template>
  <svg class="annotation-preview" viewBox="0 0 160 56" aria-hidden="true">
    <rect
      x="18"
      y="10"
      width="124"
      height="38"
      rx="3"
      fill="none"
      :stroke="color"
      stroke-width="2"
      :stroke-dasharray="dashed ? '6 4' : undefined"
    />
    <rect x="18" y="10" width="56" height="17" rx="2" :fill="color" />
    <text x="46" y="22" text-anchor="middle">{{ label }}</text>
  </svg>
</template>

<style scoped lang="scss">
.annotation-preview {
  display: block;
  width: 100%;
  height: 100%;
}

text {
  fill: #fff;
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 9px;
  font-weight: 600;
}
</style>
