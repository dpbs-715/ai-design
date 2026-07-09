import TextMaterial from '@/materials/text/component.vue'
import type { MaterialDefinition } from '@/schema/material.ts'

const textMaterial: MaterialDefinition = {
  // 物料元数据
  name: '文本',
  group: 'info',
  icon: 'solar:text-bold',
  setters: [
    {
      component: 'inputNumber',
      label: '宽度',
      field: 'layout.width',
      span: 12,
    },
    {
      component: 'inputNumber',
      label: '高度',
      field: 'layout.height',
      span: 12,
    },
    {
      component: 'inputNumber',
      label: 'x',
      field: 'layout.x',
      span: 12,
    },
    {
      component: 'inputNumber',
      label: 'y',
      field: 'layout.y',
      span: 12,
    },
    {
      component: 'input',
      label: '内容',
      field: 'props.content',
      span: 24,
    },
    {
      component: 'color',
      label: '颜色',
      field: 'style.color',
      span: 24,
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
    },
    props: {
      content: 'hello world',
    },
  },
}

export function install(register) {
  register(textMaterial, TextMaterial)
}
