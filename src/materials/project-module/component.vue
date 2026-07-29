<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import {
  normalizeProjectModuleInstanceProps,
  type PublicModuleVersionRecord,
} from '@/schema/module.ts'
import { injectDataSources, provideDataSources } from '@/context'
import { injectPublicModules } from '@/context/publicModules.ts'
import CanvasBackground from '@/components/CanvasBackground/index.vue'
import ModuleContentNode from './ModuleContentNode.vue'
import { moduleRenderPathKey, resolvePublicModuleContent } from './resolve.ts'

defineOptions({ name: 'ProjectModuleInstance' })

const { schema } = defineProps<{
  schema: MaterialSchema
}>()

const publicModules = injectPublicModules()
const pageDataSources = injectDataSources()
const parentModulePath = inject(moduleRenderPathKey, [])
const instance = computed(() => normalizeProjectModuleInstanceProps(schema.props))
const publicModule = computed(() =>
  publicModules.value.find((candidate) => candidate.id === instance.value.moduleId),
)
const hasModuleCycle = computed(() => parentModulePath.includes(instance.value.moduleId))
const selectedVersion = computed<PublicModuleVersionRecord | undefined>(() => {
  const module = publicModule.value
  if (!module) return undefined
  const version = instance.value.updatePolicy === 'latest' ? module.version : instance.value.version
  return module.versions.find((candidate) => candidate.version === version)
})
const resolvedContent = computed(() => {
  if (!selectedVersion.value || hasModuleCycle.value) return undefined
  return resolvePublicModuleContent(
    selectedVersion.value.schema,
    schema.id,
    instance.value.inputs,
    pageDataSources.value,
  )
})
const clipsContent = computed(() => resolvedContent.value?.root.props.clipContent === true)

provide(moduleRenderPathKey, [...parentModulePath, instance.value.moduleId])
provideDataSources(
  computed(() => {
    const moduleSources = resolvedContent.value?.dataSources ?? []
    const moduleSourceIds = new Set(moduleSources.map((source) => source.id))
    return [
      ...pageDataSources.value.filter((source) => !moduleSourceIds.has(source.id)),
      ...moduleSources,
    ]
  }),
)

const contentStyle = computed(() => {
  const root = resolvedContent.value?.root
  if (!root) return {}
  const placement = schema.placement.type === 'absolute' ? schema.placement : undefined
  const width = placement?.width ?? root.placement.width
  const height = placement?.height ?? root.placement.height
  return {
    width: `${root.placement.width}px`,
    height: `${root.placement.height}px`,
    transform: `scale(${width / root.placement.width}, ${height / root.placement.height})`,
    transformOrigin: 'top left',
  }
})
</script>

<template>
  <div class="module-instance" :class="{ 'is-clipped': clipsContent }">
    <div v-if="resolvedContent" class="module-content" :style="contentStyle">
      <CanvasBackground :background="resolvedContent.root.style.background" />
      <ModuleContentNode v-for="node in resolvedContent.nodes" :key="node.id" :node="node" />
    </div>
    <div v-else class="module-state">
      <Icon icon="fluent:puzzle-piece-20-filled" width="20" />
      <strong v-if="hasModuleCycle">检测到模块循环引用</strong>
      <strong v-else-if="!publicModule">公共模块不存在</strong>
      <strong v-else>模块版本 {{ instance.version }} 不可用</strong>
    </div>
  </div>
</template>

<style scoped lang="scss">
.module-instance {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  color: var(--render-theme-text-primary, var(--text-primary));
}

.module-instance.is-clipped {
  overflow: hidden;
}

.module-content {
  position: absolute;
  top: 0;
  left: 0;
}

.module-state {
  display: grid;
  width: 100%;
  height: 100%;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: var(--render-theme-text-muted, var(--text-muted));

  strong {
    font-size: 11px;
    font-weight: 500;
  }
}
</style>
