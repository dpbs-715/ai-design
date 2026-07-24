import type { MaterialDefinition } from '@/schema/material.ts'
import { createThemeColorReference } from '@/theme/renderTheme.ts'
import AnnotationNotePreview from '@/materials/previews/AnnotationNotePreview.vue'
import AnnotationNoteMaterial from './component.vue'

export const annotationNoteMaterial: MaterialDefinition = {
  name: '自由备注',
  group: 'annotation',
  icon: 'fluent:note-20-filled',
  preview: {
    component: AnnotationNotePreview,
  },
  setters: [
    {
      component: 'input',
      label: '标题',
      field: 'props.title',
      span: 24,
      props: { maxlength: 40, placeholder: '输入备注标题' },
    },
    {
      component: 'input',
      label: '描述',
      field: 'props.content',
      span: 24,
      props: {
        type: 'textarea',
        autosize: { minRows: 4, maxRows: 8 },
        resize: 'none',
        placeholder: '输入具体的改动说明',
      },
    },
    {
      component: 'themeColor',
      label: '标注颜色',
      field: 'style.accentColor',
      span: 24,
      props: { showAlpha: false },
    },
    {
      component: 'themeColor',
      label: '背景颜色',
      field: 'style.backgroundColor',
      span: 24,
      props: { showAlpha: true },
    },
    {
      component: 'themeColor',
      label: '文字颜色',
      field: 'style.color',
      span: 24,
      props: { showAlpha: true },
    },
    {
      component: 'number',
      label: '字号',
      field: 'style.fontSize',
      span: 12,
      props: { min: 12, max: 48 },
    },
    {
      component: 'number',
      label: '圆角',
      field: 'style.borderRadius',
      span: 12,
      props: { min: 0, max: 80 },
    },
    {
      component: 'number',
      label: '内边距',
      field: 'style.padding',
      span: 12,
      props: { min: 0, max: 80 },
    },
  ],
  customEventOptions: [],
  schema: {
    type: 'annotation-note',
    name: '自由备注',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 280,
      height: 150,
    },
    style: {
      accentColor: createThemeColorReference('primary'),
      backgroundColor: createThemeColorReference('container-background'),
      color: createThemeColorReference('text-primary'),
      borderRadius: 6,
      fontSize: 14,
      padding: 14,
    },
    props: {
      title: '自由备注',
      content: '在这里填写具体的改动说明。',
    },
    events: [],
  },
}

export function install(register) {
  register(annotationNoteMaterial, AnnotationNoteMaterial)
}
