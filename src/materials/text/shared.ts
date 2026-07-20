import type { MaterialSetter } from '@/schema/material.ts'

export const fontFamilyOptions = [
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

export const fontWeightOptions = [
  { label: '常规 400', value: 400 },
  { label: '中等 500', value: 500 },
  { label: '半粗 600', value: 600 },
  { label: '粗体 700', value: 700 },
  { label: '特粗 800', value: 800 },
]

export const horizontalAlignmentOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
]

export const commonTextStyleSetters: MaterialSetter[] = [
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
]
