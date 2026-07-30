<script setup lang="ts">
defineOptions({ name: 'JsonValueSetter' })

const { modelValue } = defineProps<{
  modelValue: unknown
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const text = ref('')
const error = ref('')

watch(
  () => modelValue,
  (value) => {
    text.value = JSON.stringify(value)
    error.value = ''
  },
  { immediate: true },
)

function commit() {
  try {
    emit('update:modelValue', JSON.parse(text.value))
    error.value = ''
  } catch {
    error.value = '请输入有效的 JSON 值'
  }
}
</script>

<template>
  <div class="json-value-setter">
    <el-input
      v-model="text"
      type="textarea"
      :rows="2"
      resize="none"
      placeholder='例如 ""、null 或 []'
      @blur="commit"
    />
    <span v-if="error" class="json-value-setter__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.json-value-setter {
  width: 100%;
}

.json-value-setter__error {
  display: block;
  margin-top: 4px;
  color: var(--el-color-danger);
  font-size: 11px;
}
</style>
