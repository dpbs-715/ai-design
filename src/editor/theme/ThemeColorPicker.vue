<script setup lang="ts">
import { CommonColorPicker } from '@vunio/ui'
import { ElOption, ElSelect } from 'element-plus'
import type { ThemeColorValue } from '@/theme/renderTheme.ts'
import {
  createThemeColorReference,
  isThemeColorReference,
  useRenderTheme,
} from '@/theme/renderTheme.ts'

defineOptions({ name: 'ThemeColorPicker' })

interface Props {
  modelValue?: ThemeColorValue
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  showAlpha?: boolean
  predefine?: string[]
  placeholder?: string
  colorFormat?: 'auto' | 'hex' | 'rgb'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: ThemeColorValue]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const rootRef = useTemplateRef('root')
const { theme, resolveColor } = useRenderTheme()
const customColor = ref('')
const hasCompositeFocus = ref(false)

const source = computed<'custom' | 'theme'>(() =>
  isThemeColorReference(props.modelValue) ? 'theme' : 'custom',
)

const fixedColor = computed({
  get: () => (typeof props.modelValue === 'string' ? props.modelValue : customColor.value),
  set: (color: string) => {
    customColor.value = color
    emit('update:modelValue', color)
  },
})

const selectedThemeKey = computed({
  get: () => (isThemeColorReference(props.modelValue) ? props.modelValue.key : ''),
  set: (key: string) => emit('update:modelValue', createThemeColorReference(key)),
})

watch(
  () => props.modelValue,
  (color) => {
    if (typeof color === 'string') customColor.value = color
  },
  { immediate: true },
)

function selectSource(nextSource: 'custom' | 'theme') {
  if (props.disabled || props.readonly || source.value === nextSource) return

  if (nextSource === 'theme') {
    const firstVariable = theme.value.variables[0]
    if (firstVariable) emit('update:modelValue', createThemeColorReference(firstVariable.key))
    return
  }

  const color = customColor.value || resolveColor(props.modelValue, 'value')
  emit('update:modelValue', color)
}

function onFocusIn(event: FocusEvent) {
  if (hasCompositeFocus.value || props.disabled) return
  hasCompositeFocus.value = true
  emit('focus', event)
}

function onFocusOut(event: FocusEvent) {
  window.setTimeout(() => {
    if (rootRef.value?.contains(document.activeElement)) return
    if (!hasCompositeFocus.value) return
    hasCompositeFocus.value = false
    emit('blur', event)
  })
}
</script>

<template>
  <div ref="root" class="theme-color-picker" @focusin="onFocusIn" @focusout="onFocusOut">
    <div class="color-source" role="group" aria-label="颜色来源">
      <button
        type="button"
        :class="{ active: source === 'custom' }"
        :disabled="disabled || readonly"
        @click="selectSource('custom')"
      >
        固定颜色
      </button>
      <button
        type="button"
        :class="{ active: source === 'theme' }"
        :disabled="disabled || readonly || theme.variables.length === 0"
        @click="selectSource('theme')"
      >
        主题变量
      </button>
    </div>

    <CommonColorPicker
      v-if="source === 'custom'"
      v-model="fixedColor"
      class="color-editor"
      :disabled="disabled"
      :readonly="readonly"
      :clearable="clearable"
      :show-alpha="showAlpha"
      :predefine="predefine"
      :placeholder="placeholder"
      :color-format="colorFormat"
    />

    <ElSelect
      v-else
      v-model="selectedThemeKey"
      class="variable-select"
      :disabled="disabled || readonly"
      placeholder="选择主题变量"
    >
      <ElOption
        v-for="variable in theme.variables"
        :key="variable.key"
        :label="variable.name"
        :value="variable.key"
      >
        <span class="variable-option">
          <span class="variable-option__name">{{ variable.name }}</span>
          <span class="variable-option__colors" aria-hidden="true">
            <i :style="{ background: variable.light }"></i>
            <i :style="{ background: variable.dark }"></i>
          </span>
        </span>
      </ElOption>
    </ElSelect>
  </div>
</template>

<style scoped lang="scss">
.theme-color-picker {
  width: 100%;
}

.color-source {
  display: grid;
  padding: 2px;
  margin-bottom: 8px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: var(--surface-workbench);
  grid-template-columns: repeat(2, minmax(0, 1fr));

  button {
    height: 24px;
    padding: 0 6px;
    border: 0;
    border-radius: var(--el-border-radius-small);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;

    &.active {
      background: var(--surface-raised);
      color: var(--accent-color);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }
}

.color-editor,
.variable-select {
  width: 100%;
}

.variable-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.variable-option__name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.variable-option__colors {
  display: inline-flex;
  flex: none;

  i {
    width: 16px;
    height: 16px;
    border: 1px solid var(--border-color);
    border-radius: 50%;

    & + i {
      margin-left: -4px;
    }
  }
}
</style>
