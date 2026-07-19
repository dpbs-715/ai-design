<script setup lang="ts">
import { CommonColorPicker } from '@vunio/ui'
import {
  editorAccentPresets,
  resolveEditorAccentSeed,
  useEditorTheme,
  type EditorAccentPreset,
} from './editorTheme.ts'

defineOptions({ name: 'EditorAccentControl' })

const { accentPreference, setAccentPreference } = useEditorTheme()

const isCustomActive = computed(
  () => !editorAccentPresets.some((preset) => preset.key === accentPreference.value),
)

const customColor = ref(resolveEditorAccentSeed(accentPreference.value) ?? '#3b82f6')

const popoverVisible = ref(false)
const triggerRef = useTemplateRef<HTMLButtonElement>('trigger')

function presetDotBackground(preset: EditorAccentPreset) {
  return preset.seed ?? 'conic-gradient(#1f2733 0 50%, #f5f7fb 0 100%)'
}

function selectCustom(color: string) {
  if (color) setAccentPreference(color)
}

function togglePopover() {
  popoverVisible.value = !popoverVisible.value
}

function isEventInside(event: MouseEvent, selector: string) {
  return event.target instanceof Element && Boolean(event.target.closest(selector))
}

function onDocumentClick(event: MouseEvent) {
  if (triggerRef.value?.contains(event.target as Node)) return
  if (isEventInside(event, '.editor-accent-popover')) return
  if (isEventInside(event, '.CommonColorPicker__panel')) return
  popoverVisible.value = false
}

watch(popoverVisible, (visible) => {
  if (visible) {
    document.addEventListener('click', onDocumentClick)
  } else {
    document.removeEventListener('click', onDocumentClick)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <el-popover
    :visible="popoverVisible"
    placement="bottom-end"
    trigger="click"
    :width="220"
    popper-class="editor-accent-popover"
  >
    <template #reference>
      <button
        ref="trigger"
        type="button"
        class="accent-trigger"
        aria-label="编辑器强调色"
        :aria-expanded="popoverVisible"
        @click="togglePopover"
      >
        <span class="accent-dot accent-dot--current"></span>
      </button>
    </template>

    <div class="accent-panel">
      <p class="accent-title">强调色</p>
      <div class="accent-presets" role="group" aria-label="预设强调色">
        <button
          v-for="preset in editorAccentPresets"
          :key="preset.key"
          type="button"
          class="accent-preset"
          :class="{ active: accentPreference === preset.key }"
          :aria-label="preset.name"
          :aria-pressed="accentPreference === preset.key"
          :title="preset.name"
          @click="setAccentPreference(preset.key)"
        >
          <span class="accent-dot" :style="{ background: presetDotBackground(preset) }"></span>
        </button>
      </div>

      <div class="accent-custom" :class="{ active: isCustomActive }">
        <span class="accent-custom-label">自定义</span>
        <CommonColorPicker v-model="customColor" size="small" @update:model-value="selectCustom" />
      </div>
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.accent-trigger {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0 5px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: var(--el-border-radius-base);
  background: color-mix(in srgb, var(--surface-workbench) 74%, transparent);
  transition:
    background-color 140ms ease,
    border-color 140ms ease;

  &:hover {
    background: var(--surface-raised);
    border-color: var(--border-color-strong);
  }
}

.accent-dot {
  display: block;
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-color-strong);
  border-radius: 50%;
}

.accent-dot--current {
  background: var(--accent-color);
}

.accent-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.accent-title {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.accent-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.accent-preset {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    transform 140ms ease;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: var(--accent-color);
  }
}

.accent-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.accent-custom-label {
  flex: none;
  color: var(--text-muted);
  font-size: 11px;
}
</style>
