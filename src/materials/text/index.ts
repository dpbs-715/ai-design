import TextMaterial from './component.vue'
import type { MaterialDefinition } from '@/schema/material.ts'
import TextPreview from '@/materials/previews/TextPreview.vue'

const textMaterial: MaterialDefinition = {
  // 物料元数据
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
    },
    {
      component: 'color',
      label: '颜色',
      field: 'style.color',
    },
    {
      component: 'number',
      label: '字号',
      field: 'style.fontSize',
    },
  ],

  eventOptions: [
    {
      label: '点击事件',
      value: 'click',
    },
    {
      label: '双击事件',
      value: 'dblclick',
    },
    {
      label: '组件挂载',
      value: 'vnodeMounted',
    },
  ],

  schema: {
    //dsl
    type: 'text',
    name: '普通文本',
    layout: {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    },
    style: {
      color: 'white',
      fontSize: 16,
    },
    props: {
      content: 'hello world',
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
