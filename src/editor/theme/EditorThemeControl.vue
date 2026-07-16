<script setup lang="ts">
import { useEditorTheme, type EditorThemePreference } from './editorTheme.ts'

defineOptions({ name: 'EditorThemeControl' })

interface ThemeOption {
  value: EditorThemePreference
  label: string
  icon: string
}

const themeOptions: ThemeOption[] = [
  { value: 'system', label: '跟随系统', icon: 'mdi:monitor' },
  { value: 'light', label: '浅色外观', icon: 'mdi:white-balance-sunny' },
  { value: 'dark', label: '深色外观', icon: 'mdi:weather-night' },
]

const { preference, setPreference } = useEditorTheme()

function selectTheme(nextPreference: EditorThemePreference, event: MouseEvent) {
  const button = event.currentTarget as HTMLButtonElement
  const rect = button.getBoundingClientRect()
  const useButtonCenter = event.detail === 0

  void setPreference(nextPreference, {
    x: useButtonCenter ? rect.left + rect.width / 2 : event.clientX,
    y: useButtonCenter ? rect.top + rect.height / 2 : event.clientY,
  })
}
</script>

<template>
  <div class="editor-theme-control" role="group" aria-label="设计器外观">
    <el-tooltip
      v-for="option in themeOptions"
      :key="option.value"
      :content="option.label"
      placement="bottom"
      :show-after="350"
    >
      <button
        type="button"
        class="theme-option"
        :class="{ active: preference === option.value }"
        :aria-label="option.label"
        :aria-pressed="preference === option.value"
        @click="selectTheme(option.value, $event)"
      >
        <Icon :icon="option.icon" width="15" />
      </button>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
.editor-theme-control {
  display: inline-flex;
  height: 30px;
  align-items: center;
  gap: 1px;
  padding: 2px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: color-mix(in srgb, var(--surface-workbench) 74%, transparent);
}

.theme-option {
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease;

  &:hover {
    background: var(--surface-raised);
    color: var(--text-primary);
  }

  &.active {
    border-color: color-mix(in srgb, var(--accent-color) 28%, transparent);
    background: var(--accent-soft);
    color: var(--accent-color);
  }
}
</style>
