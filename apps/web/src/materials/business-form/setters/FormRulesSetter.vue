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

/** 正则只对文本输入有意义;数字输入的值是 number,async-validator 的 pattern 不接。 */
const supportsPattern = computed(() => allowLength && inputType !== 'number')

function getRule(type: FormRuleSchema['type']) {
  return modelValue.find((rule) => rule.type === type)
}

function getValuedRule<T extends FormRuleSchema['type']>(type: T) {
  return modelValue.find(
    (rule): rule is Extract<FormRuleSchema, { type: T }> => rule.type === type,
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
    } else if (type === 'pattern') {
      rules.push({
        type,
        value: '^.+$',
        message: '格式不正确',
        trigger: ['blur', 'change'],
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
            :model-value="getValuedRule(type)?.value ?? 0"
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

    <section v-if="supportsPattern" class="form-rules-setter__rule">
      <div class="form-rules-setter__heading">
        <span>正则校验</span>
        <el-switch
          :model-value="Boolean(getRule('pattern'))"
          @update:model-value="updateRule('pattern', Boolean($event))"
        />
      </div>
      <div v-if="getRule('pattern')" class="form-rules-setter__fields form-rules-setter__fields--pattern">
        <el-input
          :model-value="getValuedRule('pattern')?.value"
          placeholder="正则表达式,如 ^\w+@\w+\.\w+$"
          @update:model-value="updateRuleField('pattern', 'value', $event)"
        />
        <el-input
          :model-value="getRule('pattern')?.message"
          placeholder="校验提示"
          @update:model-value="updateRuleField('pattern', 'message', $event)"
        />
      </div>
    </section>
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

.form-rules-setter__fields--pattern {
  grid-template-columns: 1fr 1fr;
}
</style>
