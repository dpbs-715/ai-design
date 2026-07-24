<script setup lang="ts">
import type { FormRuleSchema } from '../schema.ts'

defineOptions({ name: 'FormRulesSetter' })

const {
  modelValue = [],
  allowLength = false,
  requiredMessage = '此字段为必填项',
  inputType,
} = defineProps<{
  modelValue?: FormRuleSchema[]
  allowLength?: boolean
  requiredMessage?: string
  inputType?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [rules: FormRuleSchema[]]
}>()

const supportsLengthRules = computed(() => allowLength && inputType !== 'number')

function getRule(type: FormRuleSchema['type']) {
  return modelValue.find((rule) => rule.type === type)
}

function getLengthRule(type: 'minLength' | 'maxLength') {
  return modelValue.find(
    (rule): rule is Extract<FormRuleSchema, { type: typeof type }> => rule.type === type,
  )
}

function updateRule(type: FormRuleSchema['type'], enabled: boolean) {
  const rules = modelValue.filter((rule) => rule.type !== type)
  if (enabled) {
    if (type === 'required') {
      rules.push({
        type,
        message: requiredMessage,
        trigger: supportsLengthRules.value ? ['blur', 'change'] : ['change'],
      })
    } else {
      rules.push({
        type,
        value: type === 'minLength' ? 1 : 50,
        message: type === 'minLength' ? '内容长度不足' : '内容长度超出限制',
        trigger: ['blur', 'change'],
      })
    }
  }
  emit('update:modelValue', rules)
}

function updateRuleField(
  type: FormRuleSchema['type'],
  field: 'value' | 'message',
  value: string | number,
) {
  emit(
    'update:modelValue',
    modelValue.map((rule) => (rule.type === type ? { ...rule, [field]: value } : rule)),
  )
}
</script>

<template>
  <div class="form-rules-setter">
    <section class="form-rules-setter__rule">
      <div class="form-rules-setter__heading">
        <span>必填</span>
        <el-switch
          :model-value="Boolean(getRule('required'))"
          @update:model-value="updateRule('required', Boolean($event))"
        />
      </div>
      <el-input
        v-if="getRule('required')"
        :model-value="getRule('required')?.message"
        placeholder="必填校验提示"
        @update:model-value="updateRuleField('required', 'message', $event)"
      />
    </section>

    <template v-if="supportsLengthRules">
      <section v-for="type in ['minLength', 'maxLength'] as const" :key="type">
        <div class="form-rules-setter__heading">
          <span>{{ type === 'minLength' ? '最小长度' : '最大长度' }}</span>
          <el-switch
            :model-value="Boolean(getRule(type))"
            @update:model-value="updateRule(type, Boolean($event))"
          />
        </div>
        <div v-if="getRule(type)" class="form-rules-setter__fields">
          <el-input-number
            :model-value="getLengthRule(type)?.value ?? 0"
            :min="0"
            :max="9999"
            controls-position="right"
            @update:model-value="updateRuleField(type, 'value', $event ?? 0)"
          />
          <el-input
            :model-value="getRule(type)?.message"
            placeholder="校验提示"
            @update:model-value="updateRuleField(type, 'message', $event)"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.form-rules-setter {
  display: grid;
  width: 100%;
  gap: 10px;
}

.form-rules-setter__rule,
.form-rules-setter section {
  display: grid;
  gap: 6px;
}

.form-rules-setter__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 12px;
}

.form-rules-setter__fields {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 6px;
}
</style>
