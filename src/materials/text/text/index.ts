import type { MaterialDefinition } from '@/schema/material.ts'
import TextPreview from '@/materials/previews/TextPreview.vue'
import { commonTextStyleSetters } from '@/materials/text/shared.ts'

const verticalAlignmentOptions = [
  { label: '顶部', value: 'flex-start' },
  { label: '居中', value: 'center' },
  { label: '底部', value: 'flex-end' },
]

export const textMaterial: MaterialDefinition = {
  name: '文本',
  group: 'info',
  icon: 'fluent:text-font-20-filled',
  preview: {
    component: TextPreview,
  },
  setters: [
    {
      component: 'input',
      label: '内容',
      field: 'props.content',
      span: 24,
      props: {
        type: 'textarea',
        autosize: { minRows: 3, maxRows: 6 },
        resize: 'none',
        placeholder: '输入文本内容',
      },
    },
    ...commonTextStyleSetters,
    {
      component: 'number',
      label: '行高',
      field: 'style.lineHeight',
      span: 12,
      props: { min: 0.8, max: 3, step: 0.1, precision: 1 },
    },
    {
      component: 'commonSelect',
      label: '垂直对齐',
      field: 'props.verticalAlign',
      span: 12,
      props: { options: verticalAlignmentOptions },
    },
    {
      component: 'switch',
      label: '斜体',
      field: 'props.italic',
      span: 12,
    },
    {
      component: 'switch',
      label: '下划线',
      field: 'props.underline',
      span: 12,
    },
    {
      component: 'switch',
      label: '文字阴影',
      field: 'props.shadow',
      span: 12,
    },
    {
      component: 'switch',
      label: '自动换行',
      field: 'props.wrap',
      span: 12,
    },
  ],

  customEventOptions: [],

  schema: {
    type: 'text',
    name: '标题文本',
    layout: {
      x: 0,
      y: 0,
      width: 460,
      height: 92,
    },
    style: {
      color: { type: 'theme', key: 'text-primary' },
      backgroundColor: '',
      fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: -0.5,
      textAlign: 'left',
      padding: 18,
      borderRadius: 12,
    },
    props: {
      content: 'hello world',
      verticalAlign: 'center',
      italic: false,
      underline: false,
      shadow: true,
      wrap: true,
    },
    events: [],
  },
}
