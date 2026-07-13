import TextMaterial from './component.vue'
import type { MaterialDefinition } from '@/schema/material.ts'

const textMaterial: MaterialDefinition = {
  // 物料元数据
  name: '文本',
  group: 'info',
  icon: 'solar:text-bold',
  setters: [
    {
      component: 'number',
      label: '宽度',
      field: 'layout.width',
      span: 12,
    },
    {
      component: 'number',
      label: '高度',
      field: 'layout.height',
      span: 12,
    },
    {
      component: 'number',
      label: 'x',
      field: 'layout.x',
      span: 12,
    },
    {
      component: 'number',
      label: 'y',
      field: 'layout.y',
      span: 12,
    },
    {
      component: 'input',
      label: '内容',
      field: 'props.content',
    },
    {
      component: 'color',
      label: '颜色',
      field: 'style.color',
    },
    {
      component: 'number',
      label: '颜色',
      field: 'style.fontSize',
    },
  ],

  schema: {
    //dsl
    type: 'text',
    name: '普通文本',
    layout: {
      x: 0,
      y: 0,
      width: 300,
      height: 50,
    },
    style: {
      color: 'white',
      fontSize: 16,
    },
    props: {
      content: 'hello world',
    },
  },
}

export function install(register) {
  register(textMaterial, TextMaterial)
}
