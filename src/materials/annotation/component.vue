<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'

defineOptions({ name: 'AnnotationFrameMaterial' })

const props = defineProps<{
  schema: MaterialSchema
}>()

const { resolveColor } = useRenderTheme()

const frameStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}

  return {
    backgroundColor: resolveColor(style.backgroundColor) || 'transparent',
    borderColor: resolveColor(style.color) || 'currentColor',
    borderRadius: `${style.borderRadius ?? 4}px`,
    borderStyle: style.borderStyle ?? 'solid',
    borderWidth: `${style.borderWidth ?? 2}px`,
  }
})

const labelStyle = computed<CSSProperties>(() => ({
  backgroundColor: resolveColor(props.schema.style?.color) || 'currentColor',
}))
</script>

<template>
  <div class="annotation-frame" :style="frameStyle">
    <span v-if="schema.props.label" class="annotation-label" :style="labelStyle">
      {{ schema.props.label }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.annotation-frame {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  user-select: none;
}

.annotation-label {
  position: absolute;
  top: 0;
  left: 0;
  max-width: 100%;
  padding: 4px 9px 5px;
  overflow: hidden;
  box-sizing: border-box;
  color: #fff;
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
