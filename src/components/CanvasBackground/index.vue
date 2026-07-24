<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { CanvasBackground } from '@/schema/page.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'

defineOptions({ name: 'CanvasBackground' })

const props = defineProps<{
  background: CanvasBackground
}>()

const { resolveColor } = useRenderTheme()

const backgroundStyle = computed<CSSProperties>(() => ({
  backgroundColor: resolveColor(props.background.color) || 'transparent',
}))

const imageStyle = computed<CSSProperties>(() => {
  const image = props.background.image
  if (!image.src) return {}

  return {
    backgroundImage: `url(${JSON.stringify(image.src)})`,
    backgroundPosition: image.position,
    backgroundRepeat: image.repeat,
    backgroundSize: image.fit === 'fill' ? '100% 100%' : image.fit,
    opacity: image.opacity,
  }
})
</script>

<template>
  <div class="canvas-background" :style="backgroundStyle" aria-hidden="true">
    <div v-if="background.image.src" class="canvas-background__image" :style="imageStyle" />
  </div>
</template>

<style scoped>
.canvas-background,
.canvas-background__image {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.canvas-background {
  overflow: hidden;
}

.canvas-background__image {
  background-origin: border-box;
}
</style>
