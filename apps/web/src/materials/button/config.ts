import type { ButtonSize, ButtonType } from '@vunio/ui'

export const buttonVariantOptions: Array<{ label: string; value: ButtonType }> = [
  { label: '普通', value: 'normal' },
  { label: '主要', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' },
  { label: '信息', value: 'info' },
  { label: '链接', value: 'link' },
]

export const buttonSizeOptions: Array<{ label: string; value: ButtonSize }> = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

export const buttonIconOptions = [
  { label: '无图标', value: '' },
  { label: '添加', value: 'fluent:add-20-regular' },
  { label: '搜索', value: 'fluent:search-20-regular' },
  { label: '删除', value: 'fluent:delete-20-regular' },
  { label: '下一步', value: 'fluent:arrow-right-20-regular' },
  { label: '确认', value: 'fluent:checkmark-20-regular' },
  { label: '发送', value: 'fluent:send-20-regular' },
]

const buttonVariants = new Set(buttonVariantOptions.map((option) => option.value))
const buttonSizes = new Set(buttonSizeOptions.map((option) => option.value))

export function resolveButtonVariant(value: unknown): ButtonType {
  return buttonVariants.has(value as ButtonType) ? (value as ButtonType) : 'primary'
}

export function resolveButtonSize(value: unknown): ButtonSize {
  return buttonSizes.has(value as ButtonSize) ? (value as ButtonSize) : 'medium'
}
