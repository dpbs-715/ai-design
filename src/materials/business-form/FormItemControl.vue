<script setup lang="ts">
import { CreateComponent, type CommonFormConfig } from '@vunio/ui'
import { useDataSource } from '@/hooks/useDataSource.ts'
import type { MaterialEventProps } from '@/runtime/materialEvents.ts'
import { useMaterialDataQuery } from '@/runtime/dataQuery.ts'
import { injectRuntimeContext } from '@/runtime/runtimeContextProvider.ts'
import type { FormItemSchema } from './schema.ts'
import { resolveFormControlConfig } from './formConfig.ts'

defineOptions({ name: 'BusinessFormItemControl' })

const props = withDefaults(
  defineProps<{
    node: FormItemSchema
    config: CommonFormConfig
    modelValue: unknown
    eventProps?: MaterialEventProps
  }>(),
  {
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

defineExpose<FormItemControlExpose>({ refresh })
</script>

<template>
  <CreateComponent
    class="business-form-item-control"
    :model-value="modelValue"
    :config="resolvedConfig"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<style scoped>
.business-form-item-control {
  width: 100%;
}
</style>
