<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'
import { CommonButton, parseColor, type ButtonType } from '@vunio/ui'
import { h, type CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'
import { resolveButtonSize, resolveButtonVariant } from './config.ts'

defineOptions({
  name: 'ButtonMaterial',
  inheritAttrs: false,
})

const props = defineProps<{
  schema: MaterialSchema
}>()
const attrs = useAttrs()
const { resolvedMode, theme } = useRenderTheme()

const variantThemeKeys = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'text-secondary',
  link: 'primary',
} as const satisfies Partial<Record<ButtonType, string>>

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

function getRelativeLuminance(color: string) {
  const parsedColor = parseColor(color)
  if (!parsedColor) return

  const channels = [parsedColor.r, parsedColor.g, parsedColor.b].map((channel) => {
    const normalizedChannel = channel / 255
    return normalizedChannel <= 0.04045
      ? normalizedChannel / 12.92
      : ((normalizedChannel + 0.055) / 1.055) ** 2.4
  })

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function getReadableForeground(background: string) {
  const luminance = getRelativeLuminance(background)
  if (luminance == null) return resolvedMode.value === 'dark' ? '#000' : '#fff'

  const whiteContrast = 1.05 / (luminance + 0.05)
  const blackContrast = (luminance + 0.05) / 0.05
  return blackContrast > whiteContrast ? '#000' : '#fff'
}

const buttonThemeStyle = computed<CSSProperties>(() => {
  const themeKey = variantThemeKeys[buttonVariant.value]
  if (!themeKey) return {}

  const variable = theme.value.variables.find((candidate) => candidate.key === themeKey)
  const accent = variable?.[resolvedMode.value]

  return {
    '--button-material-accent': `var(--render-theme-${themeKey})`,
    '--button-material-foreground': accent ? getReadableForeground(accent) : undefined,
  }
})
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
    :style="buttonThemeStyle"
  >
    <span v-if="buttonText" class="button-material__text">{{ buttonText }}</span>
  </CommonButton>
</template>

<style scoped>
.button-material {
  width: 100%;
  height: 100%;
  margin: 0;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease;
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
  color: var(--button-material-foreground);
}

button.button-material:is(
    .CommonButton--primary,
    .CommonButton--success,
    .CommonButton--warning,
    .CommonButton--danger,
    .CommonButton--info
  ):hover:not(.is-disabled) {
  border-color: color-mix(
    in srgb,
    var(--button-material-accent) 84%,
    var(--render-theme-container-background)
  );
  background: color-mix(
    in srgb,
    var(--button-material-accent) 84%,
    var(--render-theme-container-background)
  );
  box-shadow: 0 4px 12px color-mix(in srgb, var(--button-material-accent) 20%, transparent);
  color: var(--button-material-foreground);
}

button.button-material.is-plain:is(
    .CommonButton--primary,
    .CommonButton--success,
    .CommonButton--warning,
    .CommonButton--danger,
    .CommonButton--info
  ) {
  border-color: color-mix(in srgb, var(--button-material-accent) 58%, var(--render-theme-border));
  background: color-mix(in srgb, var(--button-material-accent) 8%, transparent);
  color: color-mix(
    in srgb,
    var(--button-material-accent) 76%,
    var(--render-theme-text-primary)
  );
}

button.button-material.is-plain:is(
    .CommonButton--primary,
    .CommonButton--success,
    .CommonButton--warning,
    .CommonButton--danger,
    .CommonButton--info
  ):hover:not(.is-disabled) {
  border-color: var(--button-material-accent);
  background: color-mix(in srgb, var(--button-material-accent) 14%, transparent);
  box-shadow: none;
  color: color-mix(
    in srgb,
    var(--button-material-accent) 68%,
    var(--render-theme-text-primary)
  );
}

button.button-material.CommonButton--normal {
  border-color: var(--render-theme-border);
  background: var(--render-theme-container-background);
  color: var(--render-theme-text-primary);
}

button.button-material.CommonButton--normal:hover:not(.is-disabled) {
  border-color: var(--render-theme-text-placeholder);
  background: color-mix(
    in srgb,
    var(--render-theme-text-primary) 7%,
    var(--render-theme-container-background)
  );
  color: var(--render-theme-text-primary);
  opacity: 1;
}

button.button-material.CommonButton--link {
  border-color: transparent;
  background: transparent;
  color: var(--button-material-accent);
}

button.button-material.CommonButton--link:hover:not(.is-disabled) {
  border-color: transparent;
  background: color-mix(in srgb, var(--button-material-accent) 9%, transparent);
  color: var(--button-material-accent);
}

button.button-material.is-disabled {
  box-shadow: none;
}

.button-material__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
