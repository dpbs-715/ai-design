<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'
import { CommonButton } from '@vunio/ui'
import { h } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import { resolveButtonSize, resolveButtonVariant } from './config.ts'

defineOptions({
  name: 'ButtonMaterial',
  inheritAttrs: false,
})

const props = defineProps<{
  schema: MaterialSchema
}>()
const attrs = useAttrs()

const buttonText = computed(() => String(props.schema.props.text ?? '按钮'))
const buttonIcon = computed(() =>
  typeof props.schema.props.icon === 'string' ? props.schema.props.icon : '',
)
const buttonIconComponent = computed(() => {
  const icon = buttonIcon.value
  return icon ? () => h(IconifyIcon, { icon, width: 16 }) : undefined
})
const buttonVariant = computed(() => resolveButtonVariant(props.schema.props.variant))
const buttonSize = computed(() => resolveButtonSize(props.schema.props.size))
</script>

<template>
  <CommonButton
    v-bind="attrs"
    class="button-material"
    :type="buttonVariant"
    :size="buttonSize"
    :disabled="Boolean(schema.props.disabled)"
    :loading="Boolean(schema.props.loading)"
    :plain="Boolean(schema.props.plain)"
    :round="Boolean(schema.props.round)"
    :icon="buttonIconComponent"
    :aria-label="buttonText || schema.name"
  >
    <span v-if="buttonText" class="button-material__text">{{ buttonText }}</span>
  </CommonButton>
</template>

<style scoped>
.button-material {
  width: 100%;
  height: 100%;
  margin: 0;
}

button.button-material.CommonButton--primary {
  --button-material-accent: var(--el-color-primary);
}

button.button-material.CommonButton--success {
  --button-material-accent: var(--el-color-success);
}

button.button-material.CommonButton--warning {
  --button-material-accent: var(--el-color-warning);
}

button.button-material.CommonButton--danger {
  --button-material-accent: var(--el-color-danger);
}

button.button-material.CommonButton--info {
  --button-material-accent: var(--render-theme-text-secondary, var(--el-color-info));
}

button.button-material:is(
    .CommonButton--primary,
    .CommonButton--success,
    .CommonButton--warning,
    .CommonButton--danger,
    .CommonButton--info
  ) {
  border-color: var(--button-material-accent);
  background: var(--button-material-accent);
  color: #fff;
}

button.button-material:is(
    .CommonButton--primary,
    .CommonButton--success,
    .CommonButton--warning,
    .CommonButton--danger,
    .CommonButton--info
  ):hover {
  border-color: color-mix(in srgb, var(--button-material-accent) 82%, white);
  background: color-mix(in srgb, var(--button-material-accent) 82%, white);
  color: #fff;
}

button.button-material.is-plain:is(
    .CommonButton--primary,
    .CommonButton--success,
    .CommonButton--warning,
    .CommonButton--danger,
    .CommonButton--info
  ) {
  border-color: color-mix(in srgb, var(--button-material-accent) 58%, transparent);
  background: transparent;
  color: var(--button-material-accent);
}

button.button-material.is-plain:is(
    .CommonButton--primary,
    .CommonButton--success,
    .CommonButton--warning,
    .CommonButton--danger,
    .CommonButton--info
  ):hover {
  border-color: color-mix(in srgb, var(--button-material-accent) 82%, white);
  background: transparent;
  color: color-mix(in srgb, var(--button-material-accent) 82%, white);
}

button.button-material.CommonButton--link {
  border-color: transparent;
  background: transparent;
  color: var(--el-color-primary);
}

button.button-material.CommonButton--link:hover {
  border-color: transparent;
  background: transparent;
  color: color-mix(in srgb, var(--el-color-primary) 82%, white);
}

.button-material__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
