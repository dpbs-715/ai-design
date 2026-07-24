<script setup lang="ts">
import { useEventListener } from '@vunio/hooks'
import { provideDataSources } from '@/context'
import type { PageSchema } from '@/schema/page.ts'
import { createRuntimeContext } from '@/runtime/context.ts'
import { provideRenderTheme } from '@/theme/renderTheme.ts'
import { provideMaterialRenderContext } from '@/context/materialRender.ts'
import CanvasBackground from '@/components/CanvasBackground/index.vue'
import ScreenNode from './ScreenNode.vue'

defineOptions({ name: 'ScreenRenderer' })

const props = defineProps<{ page: PageSchema }>()

provideMaterialRenderContext({ mode: 'runtime' })
const runtimePage = ref(props.page)
const renderTheme = provideRenderTheme(() => runtimePage.value.theme)
const context = createRuntimeContext(runtimePage)

window.$context = context

const root = computed(() => runtimePage.value.root)
const dataSources = computed(() => runtimePage.value.dataSources)

const scale = ref(0)
const left = ref(0)
const top = ref(0)

provideDataSources(dataSources)

const canvasStyle = computed(() => ({
  ...renderTheme.rootStyle.value,
  width: `${root.value.placement.width}px`,
  height: `${root.value.placement.height}px`,
  transform: `translate(${left.value}px,${top.value}px) scale(${scale.value})`,
  transformOrigin: 'top left',
}))

function init() {
  scale.value = Math.min(
    window.innerWidth / root.value.placement.width,
    window.innerHeight / root.value.placement.height,
  )
  left.value = (window.innerWidth - root.value.placement.width * scale.value) / 2
  top.value = (window.innerHeight - root.value.placement.height * scale.value) / 2
}

useEventListener('resize', init)
onMounted(init)
</script>

<template>
  <div class="preview-container">
    <div
      class="canvas-root"
      :data-render-theme="renderTheme.resolvedMode.value"
      :style="canvasStyle"
    >
      <CanvasBackground :background="root.style.background" />
      <ScreenNode
        v-for="node in root.children"
        :key="node.id"
        :node="node"
        :context="context"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  width: 100vw;
  height: 100vh;
}

.canvas-root {
  position: relative;
  overflow: hidden;
}
</style>
