<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { ElMessage } from 'element-plus'
import type { MaterialSchema } from '@/schema/material.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'
import { injectMaterialRenderContext } from '@/context/materialRender.ts'
import { writeClipboardText } from '@/utils/clipboard.ts'

defineOptions({ name: 'AnnotationFrameMaterial' })

const props = defineProps<{
  schema: MaterialSchema
}>()

const { resolveColor } = useRenderTheme()
const { mode } = injectMaterialRenderContext()
const isEditor = mode === 'editor'
const isDetailsOpen = ref(false)
const hasDescription = computed(() => Boolean(props.schema.props.description?.trim()))

async function copyDescription() {
  try {
    await writeClipboardText(props.schema.props.description)
    ElMessage.success('描述已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择文字复制')
  }
}

const frameStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}

  return {
    '--annotation-accent': resolveColor(style.color) || 'currentColor',
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

const detailsStyle = computed<CSSProperties>(() => ({
  '--annotation-accent': resolveColor(props.schema.style?.color, 'value') || 'currentColor',
  '--el-bg-color-overlay': resolveColor({ type: 'theme', key: 'container-background' }, 'value'),
  '--el-border-color-light': resolveColor({ type: 'theme', key: 'border' }, 'value'),
  '--el-popover-bg-color': resolveColor({ type: 'theme', key: 'container-background' }, 'value'),
  backgroundColor: resolveColor({ type: 'theme', key: 'container-background' }, 'value'),
  borderColor: resolveColor({ type: 'theme', key: 'border' }, 'value'),
  borderRadius: '8px',
  boxShadow: '0 12px 32px rgb(0 0 0 / 18%)',
  color: resolveColor({ type: 'theme', key: 'text-primary' }, 'value'),
  maxWidth: 'calc(100vw - 24px)',
  padding: 0,
  width: '360px',
}))
</script>

<template>
  <div class="annotation-frame" :style="frameStyle">
    <span
      v-if="isEditor && (schema.props.label || hasDescription)"
      class="annotation-label"
      :style="labelStyle"
    >
      <span class="label-text">{{ schema.props.label }}</span>
      <span v-if="hasDescription" class="details-affordance">有描述</span>
    </span>
    <el-popover
      v-else-if="schema.props.label || hasDescription"
      v-model:visible="isDetailsOpen"
      placement="bottom-start"
      :fallback-placements="['top-start', 'right-start', 'left-start']"
      :disabled="!hasDescription"
      :teleported="true"
      :z-index="4000"
      :popper-style="detailsStyle"
      popper-class="annotation-details-popper"
      trigger="click"
    >
      <template #reference>
        <button
          class="annotation-label annotation-trigger"
          :class="{ 'has-description': hasDescription }"
          :style="labelStyle"
          type="button"
          :aria-expanded="hasDescription ? isDetailsOpen : undefined"
          @click.stop
        >
          <span class="label-text">{{ schema.props.label }}</span>
          <span v-if="hasDescription" class="details-affordance">
            详情
            <Icon
              class="details-chevron"
              :class="{ 'is-open': isDetailsOpen }"
              icon="fluent:chevron-down-20-filled"
              width="12"
            />
          </span>
        </button>
      </template>

      <div v-if="hasDescription" class="annotation-details">
        <header class="details-header">
          <strong>{{ schema.props.label || '标注详情' }}</strong>
          <button
            class="copy-button"
            type="button"
            aria-label="复制描述"
            title="复制描述"
            @click="copyDescription"
          >
            <Icon icon="fluent:copy-20-regular" width="14" />
          </button>
        </header>
        <p class="details-content">{{ schema.props.description }}</p>
      </div>
    </el-popover>
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
  display: flex;
  max-width: 100%;
  padding: 4px 9px 5px;
  overflow: hidden;
  align-items: center;
  gap: 5px;
  box-sizing: border-box;
  border: 0;
  color: #fff;
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.label-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.details-affordance {
  display: inline-flex;
  min-height: 14px;
  flex: none;
  align-items: center;
  gap: 2px;
  padding-left: 7px;
  border-left: 1px solid rgb(255 255 255 / 42%);
  font-weight: 500;
}

.details-chevron {
  transition: transform 160ms ease;
}

.details-chevron.is-open {
  transform: rotate(180deg);
}

.annotation-trigger {
  cursor: default;
}

.annotation-trigger.has-description {
  cursor: pointer;
  transition:
    filter 140ms ease,
    box-shadow 140ms ease,
    transform 80ms ease;
}

.annotation-trigger.has-description:hover {
  filter: brightness(1.08);
  box-shadow: 0 3px 10px rgb(0 0 0 / 18%);
}

.annotation-trigger.has-description:active {
  transform: translateY(1px);
}

.annotation-trigger:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -3px;
}

.annotation-details {
  display: flex;
  max-height: min(240px, calc(100vh - 32px));
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  line-height: 1.55;
  user-select: text;
}

.details-header {
  display: flex;
  min-width: 0;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--annotation-accent) 18%, transparent);
  color: var(--annotation-accent);
}

.details-header strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-button {
  display: grid;
  width: 24px;
  height: 24px;
  flex: none;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.copy-button:hover,
.copy-button:focus-visible {
  background: color-mix(in srgb, var(--annotation-accent) 12%, transparent);
}

.copy-button:focus-visible {
  outline: 2px solid var(--annotation-accent);
  outline-offset: 1px;
}

.details-content {
  min-height: 0;
  margin: 0;
  padding: 12px 14px 14px;
  overflow: auto;
  overflow-wrap: anywhere;
  scrollbar-color: color-mix(in srgb, var(--annotation-accent) 42%, transparent) transparent;
  scrollbar-width: thin;
  white-space: pre-wrap;
}

.details-content::-webkit-scrollbar {
  width: 6px;
}

.details-content::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--annotation-accent) 42%, transparent);
}

:global(.annotation-details-popper .el-popper__arrow::before) {
  background: var(--el-popover-bg-color);
  border-color: var(--el-border-color-light);
}
</style>
