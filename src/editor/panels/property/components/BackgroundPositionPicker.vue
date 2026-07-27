<script setup lang="ts">
defineOptions({ name: 'BackgroundPositionPicker' })

interface PositionOption {
  label: string
  value: string
}

const position = defineModel<string>({ required: true })

const positionOptions: PositionOption[] = [
  { label: '左上', value: 'left top' },
  { label: '顶部居中', value: 'center top' },
  { label: '右上', value: 'right top' },
  { label: '左侧居中', value: 'left center' },
  { label: '居中', value: 'center center' },
  { label: '右侧居中', value: 'right center' },
  { label: '左下', value: 'left bottom' },
  { label: '底部居中', value: 'center bottom' },
  { label: '右下', value: 'right bottom' },
]

const selectedLabel = computed(
  () => positionOptions.find((option) => option.value === position.value)?.label ?? '自定义',
)
</script>

<template>
  <div class="background-position-picker">
    <div class="position-grid" role="group" aria-label="背景图片位置">
      <button
        v-for="option in positionOptions"
        :key="option.value"
        type="button"
        :class="{ active: position === option.value }"
        :aria-label="option.label"
        :aria-pressed="position === option.value"
        :title="option.label"
        @click="position = option.value"
      >
        <span aria-hidden="true"></span>
      </button>
    </div>
    <span class="position-copy">
      <small>当前</small>
      <strong>{{ selectedLabel }}</strong>
    </span>
    <el-input
      v-model="position"
      class="position-input"
      aria-label="自定义背景图片位置"
      placeholder="例如 25% 70%"
    />
  </div>
</template>

<style scoped>
.background-position-picker {
  display: grid;
  min-height: 76px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.position-grid {
  display: grid;
  flex: none;
  grid-template-columns: repeat(3, 24px);
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-workbench);
}

.position-grid button {
  display: grid;
  width: 24px;
  height: 20px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
}

.position-grid button:hover {
  background: var(--surface-hover);
}

.position-grid button:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 1px;
}

.position-grid button.active {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-color) 36%, transparent);
}

.position-grid button span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-muted);
}

.position-grid button.active span {
  width: 6px;
  height: 6px;
  background: var(--accent-color);
}

.position-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.position-copy small {
  color: var(--text-muted);
  font-size: 10px;
}

.position-copy strong {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
}

.position-input {
  min-width: 0;
  grid-column: 1 / -1;
}
</style>
