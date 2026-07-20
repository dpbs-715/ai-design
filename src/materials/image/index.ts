import ImageMaterial from './component.vue'
import type { MaterialDefinition } from '@/schema/material.ts'
import ImagePreview from '@/materials/previews/ImagePreview.vue'

const fitOptions = [
  { label: '覆盖填充', value: 'cover' },
  { label: '完整包含', value: 'contain' },
  { label: '拉伸填满', value: 'fill' },
  { label: '原始尺寸', value: 'none' },
  { label: '缩放适应', value: 'scale-down' },
]

export const imageMaterial: MaterialDefinition = {
  name: '图片',
  group: 'media',
  icon: 'fluent:image-20-filled',
  preview: {
    component: ImagePreview,
  },
  setters: [
    {
      component: 'input',
      label: '图片地址',
      field: 'props.src',
      span: 24,
      props: {
        type: 'textarea',
        autosize: { minRows: 2, maxRows: 4 },
        resize: 'none',
        placeholder: '输入图片 URL 或 Base64',
      },
    },
    {
      component: 'input',
      label: '替代文本',
      field: 'props.alt',
      span: 24,
      props: { placeholder: '图片加载失败时的描述' },
    },
    {
      component: 'commonSelect',
      label: '填充方式',
      field: 'props.fit',
      span: 12,
      props: { options: fitOptions },
    },
    {
      component: 'number',
      label: '透明度',
      field: 'props.opacity',
      span: 12,
      props: { min: 0, max: 1, step: 0.05, precision: 2 },
    },
    {
      component: 'number',
      label: '边框宽度',
      field: 'style.borderWidth',
      span: 12,
      props: { min: 0, max: 20 },
    },
    {
      component: 'number',
      label: '圆角',
      field: 'style.borderRadius',
      span: 12,
      props: { min: 0, max: 200 },
    },
    {
      component: 'themeColor',
      label: '边框颜色',
      field: 'style.borderColor',
      span: 12,
      props: { showAlpha: true },
    },
    {
      component: 'themeColor',
      label: '背景颜色',
      field: 'style.backgroundColor',
      span: 12,
      props: { showAlpha: true },
    },
  ],
  dataBindings: [{ label: '图片地址', field: 'props.src' }],
  customEventOptions: [],
  schema: {
    type: 'image',
    name: '图片',
    layout: {
      x: 0,
      y: 0,
      width: 320,
      height: 200,
    },
    style: {
      backgroundColor: '',
      borderRadius: 8,
      borderWidth: 0,
      borderColor: '',
    },
    props: {
      src: '/image-placeholder.svg',
      alt: '',
      fit: 'cover',
      opacity: 1,
    },
    events: [],
  },
}

export function install(register) {
  register(imageMaterial, ImageMaterial)
}
