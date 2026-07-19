import TextMaterial from './component.vue'
import type { MaterialDefinition } from '@/schema/material.ts'
import TextPreview from '@/materials/previews/TextPreview.vue'

const fontFamilyOptions = [
  {
    label: '现代无衬线',
    value: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  {
    label: '中文衬线',
    value: '"Noto Serif SC", "Songti SC", SimSun, serif',
  },
  {
    label: '数字紧凑',
    value: '"DIN Alternate", "Arial Narrow", Arial, sans-serif',
  },
  {
    label: '等宽字体',
    value: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
]

const fontWeightOptions = [
  { label: '常规 400', value: 400 },
  { label: '中等 500', value: 500 },
  { label: '半粗 600', value: 600 },
  { label: '粗体 700', value: 700 },
  { label: '特粗 800', value: 800 },
]

const horizontalAlignmentOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
]

const verticalAlignmentOptions = [
  { label: '顶部', value: 'flex-start' },
  { label: '居中', value: 'center' },
  { label: '底部', value: 'flex-end' },
]

export const textMaterial: MaterialDefinition = {
  name: '文本',
  group: 'info',
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
    {
      component: 'themeColor',
      label: '文字颜色',
      field: 'style.color',
      span: 24,
      props: { showAlpha: true },
    },
    {
      component: 'themeColor',
      label: '背景颜色',
      field: 'style.backgroundColor',
      span: 24,
      props: { showAlpha: true },
    },
    {
      component: 'commonSelect',
      label: '字体',
      field: 'style.fontFamily',
      span: 24,
      props: { options: fontFamilyOptions },
    },
    {
      component: 'number',
      label: '字号',
      field: 'style.fontSize',
      span: 12,
      props: { min: 12, max: 120 },
    },
    {
      component: 'commonSelect',
      label: '字重',
      field: 'style.fontWeight',
      span: 12,
      props: { options: fontWeightOptions },
    },
    {
      component: 'number',
      label: '行高',
      field: 'style.lineHeight',
      span: 12,
      props: { min: 0.8, max: 3, step: 0.1, precision: 1 },
    },
    {
      component: 'number',
      label: '字间距',
      field: 'style.letterSpacing',
      span: 12,
      props: { min: -4, max: 20, step: 0.5, precision: 1 },
    },
    {
      component: 'commonSelect',
      label: '水平对齐',
      field: 'style.textAlign',
      span: 12,
      props: { options: horizontalAlignmentOptions },
    },
    {
      component: 'commonSelect',
      label: '垂直对齐',
      field: 'props.verticalAlign',
      span: 12,
      props: { options: verticalAlignmentOptions },
    },
    {
      component: 'number',
      label: '内边距',
      field: 'style.padding',
      span: 12,
      props: { min: 0, max: 80 },
    },
    {
      component: 'number',
      label: '圆角',
      field: 'style.borderRadius',
      span: 12,
      props: { min: 0, max: 80 },
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
    events: [
      {
        type: 'click',
        name: 'clickFn',
        title: '点击事件',
        code: ``,
      },
    ],
  },
}

export function install(register) {
  register(textMaterial, TextMaterial)
}
