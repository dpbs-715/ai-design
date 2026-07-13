<script setup lang="ts">
import { provideDataSources } from '@/context'
import type { MaterialSchema } from '@/schema/material.ts'
import { getMaterialComponent } from '@/materials'
import type { PageSchema } from '@/schema/page.ts'

defineOptions({ name: 'ScreenRenderer' })

const props = defineProps<{ page: PageSchema }>()

const canvas = computed(() => props.page.canvas)
const nodes = computed(() => props.page.nodes)
const dataSources = computed(() => props.page.dataSources)

const scale = ref(0)
const left = ref(0)
const top = ref(0)

provideDataSources(dataSources)

const canvasStyle = computed(() => ({
  width: `${canvas.value.width}px`,
  height: `${canvas.value.height}px`,
  backgroundColor: canvas.value.backgroundColor,
  transform: `translate(${left.value}px,${top.value}px) scale(${scale.value})`,
  transformOrigin: 'top left',
}))

function getNodeStyle(node: MaterialSchema, index: number) {
  return {
    width: node.layout.width + 'px',
    height: node.layout.height + 'px',
    left: node.layout.x + 'px',
    top: node.layout.y + 'px',
    zIndex: index + 1,
  }
}

function init() {
  scale.value = Math.min(
    window.innerWidth / canvas.value.width,
    window.innerHeight / canvas.value.height,
  )
  left.value = (window.innerWidth - canvas.value.width * scale.value) / 2
  top.value = (window.innerHeight - canvas.value.height * scale.value) / 2
}
onMounted(() => {
  init()
  addEventListener('resize', init)
  onBeforeUnmount(() => {
    removeEventListener('resize', init)
  })
})
</script>

<template>
  <div class="preview-container">
    <div class="canvas-root" :style="canvasStyle">
      <div
        class="canvas-node"
        :style="getNodeStyle(node, index)"
        v-for="(node, index) in nodes"
        :key="node.id"
      >
        <component :is="getMaterialComponent(node.type)" :schema="node" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview-container {
  width: 100vw;
  height: 100vh;
  .canvas-root {
    position: relative;
    .canvas-node {
      position: absolute;
    }
  }
}
</style>
