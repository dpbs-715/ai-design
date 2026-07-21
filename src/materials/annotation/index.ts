import type { Component } from 'vue'
import type { MaterialDefinition } from '@/schema/material.ts'
import AnnotationFramePreview from '@/materials/previews/AnnotationFramePreview.vue'
import AnnotationFrameMaterial from './component.vue'

const borderStyleOptions = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
]

const annotationSetters: MaterialDefinition['setters'] = [
  {
    component: 'input',
    label: '标签文字',
    field: 'props.label',
    span: 24,
    props: { maxlength: 24, placeholder: '输入简短描述' },
  },
  {
    component: 'themeColor',
    label: '标注颜色',
    field: 'style.color',
    span: 24,
    props: { showAlpha: false },
  },
  {
    component: 'themeColor',
    label: '填充颜色',
    field: 'style.backgroundColor',
    span: 24,
    props: { showAlpha: true },
  },
  {
    component: 'number',
    label: '边框宽度',
    field: 'style.borderWidth',
    span: 12,
    props: { min: 1, max: 12 },
  },
  {
    component: 'commonSelect',
    label: '边框样式',
    field: 'style.borderStyle',
    span: 12,
    props: { options: borderStyleOptions },
  },
  {
    component: 'number',
    label: '圆角',
    field: 'style.borderRadius',
    span: 12,
    props: { min: 0, max: 200 },
  },
]

interface AnnotationPreset {
  name: string
  label: string
  color: string
  backgroundColor: string
  borderStyle: 'solid' | 'dashed'
}

function createAnnotationMaterial(preset: AnnotationPreset): MaterialDefinition {
  return {
    name: preset.name,
    group: 'annotation',
    icon: 'fluent:rectangle-landscape-20-filled',
    preview: {
      component: AnnotationFramePreview,
      props: {
        color: preset.color,
        label: preset.label,
        dashed: preset.borderStyle === 'dashed',
      },
    },
    setters: annotationSetters,
    customEventOptions: [],
    schema: {
      type: 'annotation-frame',
      name: `${preset.name}标注`,
      layout: {
        x: 0,
        y: 0,
        width: 320,
        height: 180,
      },
      style: {
        color: preset.color,
        backgroundColor: preset.backgroundColor,
        borderRadius: 4,
        borderStyle: preset.borderStyle,
        borderWidth: 2,
      },
      props: {
        label: preset.label,
      },
      events: [],
    },
  }
}

const annotationMaterials = [
  createAnnotationMaterial({
    name: '新特性',
    label: '新特性',
    color: '#16a36a',
    backgroundColor: 'rgba(22, 163, 106, 0.07)',
    borderStyle: 'solid',
  }),
  createAnnotationMaterial({
    name: '功能改动',
    label: '功能改动',
    color: '#e58a17',
    backgroundColor: 'rgba(229, 138, 23, 0.07)',
    borderStyle: 'dashed',
  }),
  createAnnotationMaterial({
    name: '功能移除',
    label: '功能移除',
    color: '#dc4c4c',
    backgroundColor: 'rgba(220, 76, 76, 0.07)',
    borderStyle: 'dashed',
  }),
  createAnnotationMaterial({
    name: '自定义标注',
    label: '标注',
    color: '#3978f6',
    backgroundColor: 'rgba(57, 120, 246, 0.07)',
    borderStyle: 'solid',
  }),
]

export function install(register: (material: MaterialDefinition, component: Component) => void) {
  annotationMaterials.forEach((material) => register(material, AnnotationFrameMaterial))
}
