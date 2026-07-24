import type { MaterialDefinition } from '@/schema/material.ts'
import { createThemeColorReference } from '@/theme/renderTheme.ts'
import FreeContainerMaterial from './component.vue'
import FreeContainerPreview from './preview.vue'

export const freeContainerMaterial: MaterialDefinition = {
  name: '自由容器',
  group: 'container',
  icon: 'fluent:panel-left-expand-20-filled',
  preview: {
    component: FreeContainerPreview,
  },
  capability: {
    kind: 'container',
    roles: ['canvas-content'],
    accepts: ['canvas-content'],
  },
  setters: [
    {
      component: 'themeColor',
      label: '背景颜色',
      field: 'style.backgroundColor',
      span: 24,
      props: { showAlpha: true },
    },
    {
      component: 'themeColor',
      label: '边框颜色',
      field: 'style.borderColor',
      span: 24,
      props: { showAlpha: true },
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
      props: { min: 0, max: 100 },
    },
    {
      component: 'switch',
      label: '裁剪内容',
      field: 'childrenLayout.clip',
      span: 24,
    },
  ],
  schema: {
    type: 'free-container',
    name: '自由容器',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 560,
      height: 360,
    },
    childrenLayout: {
      type: 'absolute',
      clip: false,
    },
    style: {
      backgroundColor: createThemeColorReference('container-background'),
      borderColor: createThemeColorReference('border'),
      borderRadius: 8,
      borderStyle: 'solid',
      borderWidth: 1,
    },
    props: {},
    events: [],
  },
}

export function install(register) {
  register(freeContainerMaterial, FreeContainerMaterial)
}
