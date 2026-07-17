<script setup lang="ts">
import { provideDataSources } from '@/context'
import type { MaterialSchema } from '@/schema/material.ts'
import { getMaterialComponent } from '@/materials'
import type { PageSchema } from '@/schema/page.ts'
import { createRuntimeContext } from '@/runtime/context.ts'
import { runSandbox } from '@/runtime/sandbox.ts'
import { provideRenderTheme } from '@/theme/renderTheme.ts'

defineOptions({ name: 'ScreenRenderer' })

const props = defineProps<{ page: PageSchema }>()

const runtimePage = ref(props.page)
const renderTheme = provideRenderTheme(() => runtimePage.value.theme)
const context = createRuntimeContext(runtimePage)

window.$context = context

const canvas = computed(() => runtimePage.value.canvas)
const nodes = computed(() => runtimePage.value.nodes)
const dataSources = computed(() => runtimePage.value.dataSources)

const scale = ref(0)
const left = ref(0)
const top = ref(0)

provideDataSources(dataSources)

const canvasStyle = computed(() => ({
  ...renderTheme.rootStyle.value,
  width: `${canvas.value.width}px`,
  height: `${canvas.value.height}px`,
  backgroundColor: renderTheme.resolveColor(canvas.value.backgroundColor),
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

const vm = getCurrentInstance()

function registerNodeInstance() {
  const refs = {}
  for (const key in vm.refs) {
    refs[key] = vm.refs[key][0]
  }
  context.registerNodeInstance(refs)
}

function createEvents(node: MaterialSchema) {
  const listeners = {}
  const events = node.events || []
  events.forEach((event) => {
    if (event.handler) {
      listeners[event.type] = event.handler
      return
    }
    event.handler = listeners[event.type] = (payload) =>
      runSandbox(event.code, {
        $context: context,
        $node: node,
        $payload: payload,
      })
  })
  return listeners
}

onMounted(() => {
  registerNodeInstance()
  init()
  addEventListener('resize', init)
  onBeforeUnmount(() => {
    removeEventListener('resize', init)
  })
})
</script>

<template>
  <div class="preview-container">
    <div
      class="canvas-root"
      :data-render-theme="renderTheme.resolvedMode.value"
      :style="canvasStyle"
    >
      <div
        class="canvas-node"
        :style="getNodeStyle(node, index)"
        v-for="(node, index) in nodes"
        :key="node.id"
      >
        <component
          :ref="node.id"
          :is="getMaterialComponent(node.type)"
          :schema="node"
          v-on="createEvents(node)"
        />
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
