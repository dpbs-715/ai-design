<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import { injectMaterialRenderContext } from '@/context/materialRender.ts'
import {
  getMaterialStyleValue,
  toCssLength,
  useMaterialRootStyle,
} from '@/materials/materialStyle.ts'

defineOptions({ name: 'FreeContainerMaterial' })

const props = defineProps<{
  schema: MaterialSchema
}>()

const { mode } = injectMaterialRenderContext()

const containerStyle = useMaterialRootStyle(() => props.schema.style, {
  defaults: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 0,
    borderStyle: 'solid',
    borderWidth: 1,
  },
  overrides: () => ({
    borderRadius: toCssLength(getMaterialStyleValue(props.schema.style, 'borderRadius')),
    borderWidth: toCssLength(getMaterialStyleValue(props.schema.style, 'borderWidth'), 1),
    overflow:
      props.schema.childrenLayout?.type === 'absolute' && props.schema.childrenLayout.clip
        ? 'hidden'
        : 'visible',
  }),
})
</script>

<template>
  <div class="free-container" :style="containerStyle">
    <div v-if="mode === 'editor' && !schema.children.length" class="free-container__empty">
      拖入组件
    </div>
    <slot />
  </div>
</template>

<style scoped>
.free-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.free-container__empty {
  position: absolute;
  inset: 8px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--border-color-strong);
  color: var(--text-muted);
  font-size: 12px;
  pointer-events: none;
}
</style>
