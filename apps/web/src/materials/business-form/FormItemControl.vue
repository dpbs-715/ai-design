<script setup lang="ts">
import { CreateComponent, type CommonFormConfig } from '@vunio/ui'
import { useDataSource } from '@/hooks/useDataSource.ts'
import type { MaterialEventProps } from '@/runtime/materialEvents.ts'
import { useMaterialDataQuery } from '@/runtime/dataQuery.ts'
import { injectRuntimeContext } from '@/runtime/runtimeContextProvider.ts'
import { getByKeyOrPath } from '@vunio/utils'
import { useMaterialRootStyle } from '@/materials/materialStyle.ts'
import type { FormItemSchema } from './schema.ts'
import { resolveFormControlConfig } from './formConfig.ts'

defineOptions({ name: 'BusinessFormItemControl' })

const props = withDefaults(
  defineProps<{
    node: FormItemSchema
    config: CommonFormConfig
    modelValue: unknown
    readonly?: boolean
    eventProps?: MaterialEventProps
  }>(),
  {
    readonly: false,
    eventProps: () => ({}),
  },
)

export interface FormItemControlExpose {
  refresh(params?: Record<string, any>): Promise<void>
}

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const runtimeContext = injectRuntimeContext(null)
const controlStyle = useMaterialRootStyle(() => props.node.style)
const dataId = computed(() => props.node.dataId)
const dataQuery = useMaterialDataQuery(() => props.node, runtimeContext)
const { data, refresh } = useDataSource(dataId, dataQuery)

function mergeEventProps(
  controlProps: Record<string, any> | undefined,
  eventProps: MaterialEventProps,
) {
  const mergedProps = { ...controlProps }

  Object.entries(eventProps).forEach(([eventProp, listener]) => {
    const controlListener = mergedProps[eventProp]
    mergedProps[eventProp] = (...args: unknown[]) => {
      if (Array.isArray(controlListener)) {
        controlListener.forEach((candidate) => candidate(...args))
      } else if (typeof controlListener === 'function') {
        controlListener(...args)
      }
      return listener(...args)
    }
  })

  return mergedProps
}

const resolvedConfig = computed(() => {
  const config = resolveFormControlConfig(props.node, props.config, data.value)
  return {
    ...config,
    component: config.component ?? 'input',
    props: mergeEventProps(config.props, props.eventProps),
  }
})

function getReadonlyOptionLabel(value: unknown) {
  const config = resolvedConfig.value
  if (!['commonSelect', 'radioGroup', 'checkboxGroup'].includes(String(config.component))) {
    return
  }

  const optionProps = config.props ?? {}
  const labelField = String(optionProps.labelField ?? 'label')
  const valueField = String(optionProps.valueField ?? 'value')
  const childrenField = String(optionProps.childrenField ?? 'children')
  const options = Array.isArray(optionProps.options) ? optionProps.options : []
  const pending = [...options]

  while (pending.length) {
    const option = pending.shift()
    if (!option || typeof option !== 'object') continue
    if (getByKeyOrPath(option, valueField) === value) {
      const label = getByKeyOrPath(option, labelField)
      return label == null ? String(value) : String(label)
    }
    const children = getByKeyOrPath(option, childrenField)
    if (Array.isArray(children)) pending.push(...children)
  }
}

function formatReadonlyValue(value: unknown) {
  if (value == null || value === '') return '—'
  if (Array.isArray(value)) {
    if (!value.length) return '—'
    return value.map((item) => getReadonlyOptionLabel(item) ?? String(item)).join('、')
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return getReadonlyOptionLabel(value) ?? String(value)
}

const readonlyValue = computed(() => formatReadonlyValue(props.modelValue))

defineExpose<FormItemControlExpose>({ refresh })
</script>

<template>
  <div class="business-form-item-control" :style="controlStyle">
    <span v-if="readonly" class="business-form-item-control__readonly">{{ readonlyValue }}</span>
    <CreateComponent
      v-else
      class="business-form-item-control__component"
      :model-value="modelValue"
      :config="resolvedConfig"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<style scoped>
.business-form-item-control,
.business-form-item-control__component {
  width: 100%;
}

.business-form-item-control__readonly {
  min-width: 0;
  color: var(--el-text-color-regular);
  line-height: var(--el-component-size);
  overflow-wrap: anywhere;
}
</style>
