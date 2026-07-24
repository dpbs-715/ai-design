<script setup lang="ts">
defineOptions({ name: 'BusinessFormPreview' })

const { kind } = defineProps<{
  kind: 'form' | 'input' | 'select' | 'radio' | 'checkboxGroup' | 'date' | 'color'
}>()

const fieldText = computed(() => {
  const labels = {
    input: 'Aa',
    select: '请选择',
    radio: '◉  ○',
    checkboxGroup: '☑  ☐',
    date: '2026-07-24',
    color: '#409EFF',
  }
  return kind === 'form' ? '' : labels[kind]
})

const suffixIcon = computed(() => {
  if (kind === 'select') return 'fluent:chevron-down-16-regular'
  if (kind === 'date') return 'fluent:calendar-16-regular'
  return ''
})
</script>

<template>
  <div class="form-preview" :class="`form-preview--${kind}`">
    <template v-if="kind === 'form'">
      <span class="form-preview__label"></span>
      <span class="form-preview__control"></span>
      <span class="form-preview__label form-preview__label--short"></span>
      <span class="form-preview__control"></span>
    </template>
    <template v-else>
      <span class="form-preview__field">
        <span>{{ fieldText }}</span>
        <Icon v-if="suffixIcon" :icon="suffixIcon" width="13" />
        <i v-else-if="kind === 'color'" class="form-preview__color"></i>
      </span>
    </template>
  </div>
</template>

<style scoped>
.form-preview {
  width: 76%;
  color: var(--text-muted);
}

.form-preview--form {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 6px 8px;
}

.form-preview__label {
  height: 5px;
  align-self: center;
  border-radius: 999px;
  background: var(--border-color-strong);
}

.form-preview__label--short {
  width: 70%;
}

.form-preview__control,
.form-preview__field {
  height: 18px;
  box-sizing: border-box;
  border: 1px solid var(--border-color-strong);
  border-radius: 4px;
  background: var(--surface-panel);
}

.form-preview__field {
  display: flex;
  height: 28px;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  font-size: 10px;
}

.form-preview__color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--accent-color);
}
</style>
