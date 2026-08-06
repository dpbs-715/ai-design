<script setup lang="ts">
import type { CommonFormConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { deepClone, getByKeyOrPath, setByKeyOrPath } from '@vunio/utils'
import type { BusinessFormSchema, FormItemSchema } from './schema.ts'
import { toCommonFormConfig, toCommonFormProps } from './formConfig.ts'
import { createInitialFormValues, createSourceFormValues, replaceFormValues } from './formValues.ts'
import FormItemControl, { type FormItemControlExpose } from './FormItemControl.vue'
import { injectRuntimeContext } from '@/runtime/runtimeContextProvider.ts'
import { createMaterialEventProps } from '@/runtime/materialEvents.ts'
import { createThemeColorReference } from '@/theme/renderTheme.ts'
import { useDataSource } from '@/hooks/useDataSource.ts'
import { useMaterialDataQuery } from '@/runtime/dataQuery.ts'
import { useMaterialRootStyle } from '@/materials/materialStyle.ts'

defineOptions({ name: 'BusinessFormMaterial' })

interface CommonFormExpose {
  validateForm(fields?: string[]): Promise<void>
  waitForReady(): Promise<void>
  clearValidate(fields?: string[]): void
}

type BusinessFormConfigManager = ReturnType<typeof useConfigs<CommonFormConfig>>

export interface BusinessFormExpose {
  validate(): Promise<void>
  resetFields(): void
  clearValidate(fields?: string[]): void
  getValues(): Record<string, unknown>
  setValue(field: string, value: unknown): void
  setValues(values: Record<string, unknown>): void
  submit(): Promise<Record<string, unknown>>
  refresh(): Promise<void>
  setHidden: BusinessFormConfigManager['setHidden']
  setDisabled: BusinessFormConfigManager['setDisabled']
  setDisabledAll: BusinessFormConfigManager['setDisabledAll']
  setPropsByField: BusinessFormConfigManager['setPropsByField']
  getConfigByField: BusinessFormConfigManager['getConfigByField']
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
const defaultBackgroundColor = createThemeColorReference('container-background')
const formItems = computed(() => schema.children as FormItemSchema[])
const initialValues = computed(() => createInitialFormValues(formItems.value))
const formValues = reactive<Record<string, unknown>>(initialValues.value)
const baselineValues = ref<Record<string, unknown>>(deepClone(initialValues.value))
const pendingSourceValues = ref<Record<string, unknown>>()
const dataId = computed(() => schema.dataId)
const dataQuery = useMaterialDataQuery(() => schema, runtimeContext)
const { data, loading, refresh: refreshSource } = useDataSource(dataId, dataQuery)
const schemaConfigs = computed(() => formItems.value.map(toCommonFormConfig))
const configManager = useConfigs<CommonFormConfig>(schemaConfigs, false)
const commonFormProps = computed(() => toCommonFormProps(schema.props))
const formStyle = useMaterialRootStyle(() => schema.style, {
  defaults: { backgroundColor: defaultBackgroundColor },
})
const dirty = computed(() => JSON.stringify(formValues) !== JSON.stringify(baselineValues.value))

watchEffect((onCleanup) => {
  const unregisterValues = formItems.value.map((item) => {
    const field = item.props.field
    return runtimeContext.registerNodeValue(item.id, () => getByKeyOrPath(formValues, field))
  })
  onCleanup(() => unregisterValues.forEach((unregister) => unregister()))
})

function getSourceValues() {
  if (dataId.value == null || data.value === undefined || loading.value) {
    return initialValues.value
  }
  return createSourceFormValues(formItems.value, data.value)
}

function replaceSourceValues(values: Record<string, unknown>) {
  const nextValues = deepClone(values)
  baselineValues.value = nextValues
  replaceFormValues(formValues, nextValues)
  pendingSourceValues.value = undefined
}

watch(dataId, () => replaceSourceValues(initialValues.value))

watch(
  data,
  (payload) => {
    if (dataId.value == null || payload === undefined) return
    const sourceValues = createSourceFormValues(formItems.value, payload)
    if (dirty.value) {
      pendingSourceValues.value = deepClone(sourceValues)
      return
    }
    replaceSourceValues(sourceValues)
  },
  { immediate: true },
)

watch(dirty, (value) => {
  if (value || !pendingSourceValues.value) return
  replaceSourceValues(pendingSourceValues.value)
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
    const nextValues = deepClone(getSourceValues())
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
  replaceSourceValues(pendingSourceValues.value ?? baselineValues.value)
  nextTick(() => clearValidate())
  emit('reset', getValues())
}

async function submit() {
  await validate()
  const values = getValues()
  emit('submit', values)
  return values
}

async function refresh() {
  await refreshSource()
}

defineExpose<BusinessFormExpose>({
  validate,
  resetFields,
  clearValidate,
  getValues,
  setValue,
  setValues,
  submit,
  refresh,
  setHidden: configManager.setHidden,
  setDisabled: configManager.setDisabled,
  setDisabledAll: configManager.setDisabledAll,
  setPropsByField: configManager.setPropsByField,
  getConfigByField: configManager.getConfigByField,
})
</script>

<template>
  <div class="business-form" :style="formStyle">
    <div v-if="!formItems.length" class="business-form__empty">暂无表单字段</div>
    <CommonForm
      v-else
      ref="form"
      v-bind="commonFormProps"
      :model-value="formValues"
      :config="runtimeConfigs"
      :loading="loading"
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
          :readonly="schema.props.readonly"
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
}

.business-form__empty {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
