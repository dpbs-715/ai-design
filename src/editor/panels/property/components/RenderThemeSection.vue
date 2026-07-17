<script setup lang="ts">
import { CommonColorPicker, SetFormFieldCommand } from '@vunio/ui'
import { storeToRefs } from 'pinia'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import type { RenderThemeMode, ThemeVariable } from '@/theme/renderTheme.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'
import { useEditorStore } from '@/stores/editor.ts'

defineOptions({ name: 'RenderThemeSection' })

interface ThemeModeOption {
  value: RenderThemeMode
  label: string
  icon: string
}

const themeModeOptions: ThemeModeOption[] = [
  { value: 'system', label: '系统', icon: 'mdi:monitor' },
  { value: 'light', label: '浅色', icon: 'mdi:white-balance-sunny' },
  { value: 'dark', label: '深色', icon: 'mdi:weather-night' },
]

const editorStore = useEditorStore()
const { theme } = storeToRefs(editorStore)
const { resolvedMode } = useRenderTheme()
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()
const getPageData = () => editorStore.page

function setThemeField(field: string, value: unknown) {
  dispatchCommand(new SetFormFieldCommand(getPageData, `theme.${field}`, value))
}

function setThemeMode(mode: RenderThemeMode) {
  if (theme.value.mode !== mode) setThemeField('mode', mode)
}

function updateVariable(key: string, patch: Partial<ThemeVariable>) {
  const variables = theme.value.variables.map((variable) =>
    variable.key === key ? { ...variable, ...patch } : variable,
  )
  setThemeField('variables', variables)
}

function addVariable() {
  const primaryVariable = theme.value.variables.find((variable) => variable.key === 'primary')

  setThemeField('variables', [
    ...theme.value.variables,
    {
      key: `custom-${crypto.randomUUID()}`,
      name: '自定义颜色',
      type: 'color',
      light: primaryVariable?.light ?? '#000000',
      dark: primaryVariable?.dark ?? '#ffffff',
    },
  ])
}

function removeVariable(variable: ThemeVariable) {
  if (variable.builtin) return
  setThemeField(
    'variables',
    theme.value.variables.filter((candidate) => candidate.key !== variable.key),
  )
}
</script>

<template>
  <section class="render-theme-section">
    <div class="section-heading">
      <span>
        <strong>渲染区主题</strong>
        <small>组件共享的浅色与深色变量</small>
      </span>
      <em>{{ resolvedMode === 'dark' ? '深色预览' : '浅色预览' }}</em>
    </div>

    <div class="theme-mode" role="group" aria-label="渲染区主题模式">
      <button
        v-for="option in themeModeOptions"
        :key="option.value"
        type="button"
        :class="{ active: theme.mode === option.value }"
        :aria-pressed="theme.mode === option.value"
        @click="setThemeMode(option.value)"
      >
        <Icon :icon="option.icon" width="15" />
        <span>{{ option.label }}</span>
      </button>
    </div>

    <div class="variables-heading">
      <span>主题变量</span>
      <small>{{ theme.variables.length }} 个</small>
    </div>

    <div class="theme-variables">
      <article v-for="variable in theme.variables" :key="variable.key" class="theme-variable">
        <div class="variable-heading">
          <span v-if="variable.builtin" class="variable-name">{{ variable.name }}</span>
          <el-input
            v-else
            class="variable-name-input"
            :model-value="variable.name"
            size="small"
            @focus="startBatch"
            @blur="commitBatch"
            @update:model-value="updateVariable(variable.key, { name: $event })"
          />
          <span v-if="variable.builtin" class="builtin-badge">内置</span>
          <button
            v-else
            type="button"
            class="delete-variable"
            aria-label="删除主题变量"
            @click="removeVariable(variable)"
          >
            <Icon icon="mdi:trash-can-outline" width="15" />
          </button>
        </div>

        <div class="variable-colors">
          <label>
            <span><i class="light-dot"></i>浅色</span>
            <CommonColorPicker
              :model-value="variable.light"
              size="small"
              @focus="startBatch"
              @blur="commitBatch"
              @update:model-value="updateVariable(variable.key, { light: $event })"
            />
          </label>
          <label>
            <span><i class="dark-dot"></i>深色</span>
            <CommonColorPicker
              :model-value="variable.dark"
              size="small"
              @focus="startBatch"
              @blur="commitBatch"
              @update:model-value="updateVariable(variable.key, { dark: $event })"
            />
          </label>
        </div>
      </article>
    </div>

    <button type="button" class="add-variable" @click="addVariable">
      <Icon icon="mdi:plus" width="16" />
      添加颜色变量
    </button>
  </section>
</template>

<style scoped lang="scss">
.render-theme-section {
  padding: 0 14px 18px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 0 12px;
  border-top: 1px solid var(--border-color);

  > span {
    display: flex;
    flex-direction: column;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
  }

  small {
    margin-top: 3px;
    color: var(--text-muted);
    font-size: 11px;
  }

  em {
    padding: 3px 6px;
    border-radius: 4px;
    background: var(--accent-soft);
    color: var(--accent-color);
    font-size: 10px;
    font-style: normal;
  }
}

.theme-mode {
  display: grid;
  padding: 3px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-workbench);
  grid-template-columns: repeat(3, minmax(0, 1fr));

  button {
    display: inline-flex;
    height: 28px;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;

    &.active {
      background: var(--surface-raised);
      box-shadow: 0 1px 3px rgb(0 0 0 / 14%);
      color: var(--accent-color);
    }
  }
}

.variables-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 17px 1px 8px;
  color: var(--text-secondary);
  font-size: 12px;

  small {
    color: var(--text-muted);
    font-size: 10px;
  }
}

.theme-variables {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-variable {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-workbench);
}

.variable-heading {
  display: flex;
  min-height: 24px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.variable-name {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variable-name-input {
  flex: 1;
}

.builtin-badge {
  flex: none;
  padding: 2px 5px;
  border-radius: 3px;
  background: var(--surface-raised);
  color: var(--text-muted);
  font-size: 9px;
}

.delete-variable {
  display: grid;
  width: 24px;
  height: 24px;
  flex: none;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
    color: var(--el-color-danger);
  }
}

.variable-colors {
  display: grid;
  gap: 8px;
  margin-top: 9px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  label > span {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
    color: var(--text-muted);
    font-size: 10px;
  }

  i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .light-dot {
    border: 1px solid var(--border-color-strong);
    background: #ffffff;
  }

  .dark-dot {
    background: #111827;
  }

  :deep(.CommonColorPicker) {
    width: 100%;
  }
}

.add-variable {
  display: inline-flex;
  width: 100%;
  height: 32px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;
  border: 1px dashed var(--border-color-strong);
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 11px;

  &:hover {
    border-color: var(--accent-color);
    background: var(--accent-soft);
    color: var(--accent-color);
  }
}
</style>
