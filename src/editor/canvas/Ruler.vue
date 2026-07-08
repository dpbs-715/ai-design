<script setup lang="ts">
import SketchRuler from 'vue3-sketch-ruler'
import 'vue3-sketch-ruler/lib/style.css'

defineOptions({
  name: 'Ruler',
})

defineProps({
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  canvasWidth: {
    type: Number,
  },
  canvasHeight: {
    type: Number,
  },
  thick: {
    type: Number,
    default: 20,
  },
})

const sketchRef = ref()

const state = reactive({
  scale: 1,
  isShowReferLine: true,
  lines: { h: [0, 250], v: [0, 500] },
})

const palette = {
  bgColor: '#1f2937',
  longfgColor: '#6b7280',
  fontColor: '#9ca3af',
  fontShadowColor: '#0e8da7',
  shadowColor: 'rgba(14,141,167,0.14)',
  lineColor: '#22c55e',
  lineTYpe: 'solid',
  lockLineColor: '#4b5563',
  borderColor: '#374151',
  hoverBg: '#111827',
  hoverColor: '#ffffff',
}
</script>

<template>
  <SketchRuler
    ref="sketchRef"
    :palette="palette"
    v-model:scale="state.scale"
    :width="width"
    :height="height"
    :canvas-width="canvasWidth"
    :canvas-height="canvasHeight"
    :thick="thick"
    :is-show-refer-line="state.isShowReferLine"
    :enable-animation="true"
    animation-mode="ease-out"
    v-bind="$attrs"
  >
    <slot />
  </SketchRuler>
</template>

<style scoped lang="scss"></style>
