<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import { injectMaterialRenderContext } from '@/context/materialRender.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'

defineOptions({ name: 'FreeContainerMaterial' })

const props = defineProps<{
  schema: MaterialSchema
}>()

const { mode } = injectMaterialRenderContext()
const { resolveColor } = useRenderTheme()

const containerStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}
  const borderWidth = style.borderWidth ?? 1

  return {
    backgroundColor: resolveColor(style.backgroundColor) || 'transparent',
    borderColor: resolveColor(style.borderColor) || 'transparent',
    borderRadius: `${style.borderRadius ?? 0}px`,
    borderStyle: style.borderStyle ?? 'solid',
    borderWidth: `${borderWidth}px`,
    overflow:
      props.schema.childrenLayout?.type === 'absolute' && props.schema.childrenLayout.clip
        ? 'hidden'
        : 'visible',
  }
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
