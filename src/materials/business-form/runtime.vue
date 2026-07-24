<script setup lang="ts">
import type { CommonFormConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { deepClone, getByKeyOrPath, setByKeyOrPath } from '@vunio/utils'
import type { BusinessFormSchema, FormItemSchema } from './schema.ts'
import { toCommonFormConfig } from './formConfig.ts'
import { createInitialFormValues, replaceFormValues } from './formValues.ts'
import FormItemControl, { type FormItemControlExpose } from './FormItemControl.vue'
import { injectRuntimeContext } from '@/runtime/runtimeContextProvider.ts'
import { createMaterialEventProps } from '@/runtime/materialEvents.ts'

defineOptions({ name: 'BusinessFormMaterial' })

interface CommonFormExpose {
  validateForm(fields?: string[]): Promise<void>
  waitForReady(): Promise<void>
  clearValidate(fields?: string[]): void
}

export interface BusinessFormExpose {
  validate(): Promise<void>
  resetFields(): void
  clearValidate(fields?: string[]): void
  getValues(): Record<string, unknown>
  setValue(field: string, value: unknown): void
  setValues(values: Record<string, unknown>): void
  submit(): Promise<Record<string, unknown>>
  configManager: ReturnType<typeof useConfigs<CommonFormConfig>>
}

const { schema } = defineProps<{
  schema: BusinessFormSchema
}>()

const emit = defineEmits<{
  change: [payload: { field: string; value: unknown; values: Record<string, unknown> }]
  submit: [values: Record<string, unknown>]
  reset: [values: Record<string, unknown>]
}>()

const formRef = useTemplateRef<CommonFormExpose>('form')
const runtimeContext = injectRuntimeContext()
const initialValues = computed(() => createInitialFormValues(schema.children))
const formValues = reactive<Record<string, unknown>>(initialValues.value)
const formItems = computed(() => schema.children as FormItemSchema[])
const schemaConfigs = computed(() => formItems.value.map(toCommonFormConfig))
const configManager = useConfigs<CommonFormConfig>(schemaConfigs, false)

watchEffect((onCleanup) => {
  const unregisterValues = formItems.value.map((item) => {
    const field = item.props.field
    return runtimeContext.registerNodeValue(item.id, () => getByKeyOrPath(formValues, field))
  })
  onCleanup(() => unregisterValues.forEach((unregister) => unregister()))
})

function notifyFieldChange(field: string, value: unknown) {
  setByKeyOrPath(formValues, field, value)
  emit('change', {
    field,
    value: deepClone(value),
    values: getValues(),
  })
}

const runtimeConfigs = computed<CommonFormConfig[]>(() =>
  configManager.config.map((config) => ({
    ...config,
    props: {
      ...config.props,
      disabled: schema.props.disabled || config.props?.disabled,
      ...(config.component === 'input'
        ? { onInput: (value: unknown) => notifyFieldChange(config.field, value) }
        : { onChange: (value: unknown) => notifyFieldChange(config.field, value) }),
    },
  })),
)

function registerFormItemInstance(id: string, instance: FormItemControlExpose | null) {
  if (instance) runtimeContext.registerNodeInstance(id, instance)
  else runtimeContext.unregisterNodeInstance(id)
}

onBeforeUnmount(() => {
  formItems.value.forEach((item) => runtimeContext.unregisterNodeInstance(item.id))
})

watch(
  () => formItems.value.map((item) => item.props.field),
  () => {
    const nextValues = createInitialFormValues(formItems.value)
    formItems.value.forEach((item) => {
      const currentValue = getByKeyOrPath(formValues, item.props.field)
      if (currentValue !== undefined) {
        setByKeyOrPath(nextValues, item.props.field, deepClone(currentValue))
      }
    })
    replaceFormValues(formValues, nextValues)
  },
  { deep: true },
)

async function validate() {
  await formRef.value?.waitForReady()
  await formRef.value?.validateForm()
}

function clearValidate(fields?: string[]) {
  formRef.value?.clearValidate(fields)
}

function getValues() {
  return deepClone(formValues)
}

function setValue(field: string, value: unknown) {
  notifyFieldChange(field, value)
}

function setValues(values: Record<string, unknown>) {
  Object.entries(values).forEach(([field, value]) => setByKeyOrPath(formValues, field, value))
}

function resetFields() {
  replaceFormValues(formValues, initialValues.value)
  nextTick(() => clearValidate())
  emit('reset', getValues())
}

async function submit() {
  await validate()
  const values = getValues()
  emit('submit', values)
  return values
}

defineExpose<BusinessFormExpose>({
  validate,
  resetFields,
  clearValidate,
  getValues,
  setValue,
  setValues,
  submit,
  configManager,
})
</script>

<template>
  <div class="business-form">
    <div v-if="!formItems.length" class="business-form__empty">暂无表单字段</div>
    <CommonForm
      v-else
      ref="form"
      :model-value="formValues"
      :config="runtimeConfigs"
      :label-position="schema.props.labelPosition"
      :label-width="`${schema.props.labelWidth}px`"
      :size="schema.props.size"
    >
      <template
        v-for="item in formItems"
        :key="item.id"
        #[item.props.field]="{ config, modelValue, updateModelValue }"
      >
        <FormItemControl
          :ref="
            (instance) =>
              registerFormItemInstance(item.id, instance as unknown as FormItemControlExpose)
          "
          :node="item"
          :config="config"
          :model-value="modelValue"
          :event-props="createMaterialEventProps(item, runtimeContext)"
          @update:model-value="updateModelValue"
        />
      </template>
    </CommonForm>
  </div>
</template>

<style scoped>
.business-form {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  overflow: auto;
  background: var(--surface-panel);
}

.business-form__empty {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
