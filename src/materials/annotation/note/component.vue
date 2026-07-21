<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { ElMessage } from 'element-plus'
import type { MaterialSchema } from '@/schema/material.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'
import { injectMaterialRenderContext } from '@/context/materialRender.ts'

defineOptions({ name: 'AnnotationNoteMaterial' })

const props = defineProps<{
  schema: MaterialSchema
}>()

const { resolveColor } = useRenderTheme()
const { mode } = injectMaterialRenderContext()
const isEditor = mode === 'editor'

async function copyNote() {
  const text = [props.schema.props.title, props.schema.props.content].filter(Boolean).join('\n')

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('备注已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择文字复制')
  }
}

const noteStyle = computed<CSSProperties>(() => {
  const style = props.schema.style ?? {}

  return {
    '--annotation-accent': resolveColor(style.accentColor) || 'currentColor',
    backgroundColor: resolveColor(style.backgroundColor) || 'transparent',
    borderRadius: `${style.borderRadius ?? 6}px`,
    color: resolveColor(style.color) || 'inherit',
    fontSize: `${style.fontSize ?? 14}px`,
    padding: `${style.padding ?? 14}px`,
  }
})
</script>

<template>
  <article class="annotation-note" :class="{ 'is-editor': isEditor }" :style="noteStyle">
    <header class="note-header">
      <h3 v-if="schema.props.title" class="note-title">{{ schema.props.title }}</h3>
      <button
        v-if="!isEditor"
        class="copy-button"
        type="button"
        aria-label="复制备注"
        title="复制备注"
        @mousedown.stop
        @click.stop="copyNote"
      >
        <Icon icon="fluent:copy-20-regular" width="14" />
      </button>
    </header>
    <p class="note-content">{{ schema.props.content }}</p>
  </article>
</template>

<style scoped lang="scss">
.annotation-note {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--annotation-accent) 28%, transparent);
  box-shadow: inset 4px 0 0 var(--annotation-accent);
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  line-height: 1.55;
  user-select: none;
}

.note-header {
  display: flex;
  min-width: 0;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.note-title {
  overflow: hidden;
  min-width: 0;
  flex: 1;
  margin: 0;
  color: var(--annotation-accent);
  font-size: 1em;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  user-select: text;
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
  opacity: 0.58;
  transition:
    background-color 140ms ease,
    opacity 140ms ease;
}

.copy-button:hover,
.copy-button:focus-visible {
  background: color-mix(in srgb, var(--annotation-accent) 12%, transparent);
  opacity: 1;
}

.copy-button:focus-visible {
  outline: 2px solid var(--annotation-accent);
  outline-offset: 1px;
}

.note-content {
  min-height: 0;
  flex: 1;
  margin: 0;
  overflow: auto;
  font-size: 1em;
  overflow-wrap: anywhere;
  scrollbar-color: color-mix(in srgb, var(--annotation-accent) 42%, transparent) transparent;
  scrollbar-width: thin;
  user-select: text;
  white-space: pre-wrap;
}

.note-content::-webkit-scrollbar {
  width: 6px;
}

.note-content::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--annotation-accent) 42%, transparent);
}

.annotation-note.is-editor .note-title,
.annotation-note.is-editor .note-content {
  user-select: none;
}

.annotation-note.is-editor .note-content {
  overflow: hidden;
}
</style>
