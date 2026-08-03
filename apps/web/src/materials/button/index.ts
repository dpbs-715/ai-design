import type { MaterialDefinition } from '@/schema/material.ts'
import ButtonMaterial from './component.vue'
import ButtonMaterialPreview from './preview.vue'
import { buttonIconOptions, buttonSizeOptions, buttonVariantOptions } from './config.ts'

export const buttonMaterial: MaterialDefinition = {
  name: '按钮',
  group: 'interaction',
  icon: 'fluent:cursor-click-20-filled',
  preview: {
    component: ButtonMaterialPreview,
  },
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
  },
  setters: [
    {
      component: 'input',
      label: '按钮文字',
      field: 'props.text',
      span: 24,
      props: { placeholder: '输入按钮文字' },
    },
    {
      component: 'commonSelect',
      label: '按钮类型',
      field: 'props.variant',
      span: 12,
      props: { options: buttonVariantOptions },
    },
    {
      component: 'commonSelect',
      label: '按钮尺寸',
      field: 'props.size',
      span: 12,
      props: { options: buttonSizeOptions },
    },
    {
      component: 'commonSelect',
      label: '前置图标',
      field: 'props.icon',
      span: 24,
      props: { options: buttonIconOptions },
    },
    { component: 'switch', label: '禁用', field: 'props.disabled', span: 12 },
    { component: 'switch', label: '加载中', field: 'props.loading', span: 12 },
    { component: 'switch', label: '朴素样式', field: 'props.plain', span: 12 },
    { component: 'switch', label: '圆角按钮', field: 'props.round', span: 12 },
  ],
  schema: {
    type: 'button',
    name: '按钮',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 144,
      height: 44,
    },
    props: {
      text: '按钮',
      variant: 'primary',
      size: 'medium',
      icon: '',
      disabled: false,
      loading: false,
      plain: false,
      round: false,
    },
    events: [
      {
        type: 'click',
        name: 'onClick',
        title: '点击事件',
        code: '',
      },
    ],
  },
}

export function install(register) {
  register(buttonMaterial, ButtonMaterial)
}
