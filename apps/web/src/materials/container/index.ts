import { freeContainerDescriptor } from '@ai-design/materials'
import { defineMaterial } from '@/materials/defineMaterial.ts'
import FreeContainerMaterial from './component.vue'
import FreeContainerPreview from './preview.vue'

export const freeContainerMaterial = defineMaterial(freeContainerDescriptor, {
  icon: 'fluent:panel-left-expand-20-filled',
  preview: {
    component: FreeContainerPreview,
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
})

export function install(register) {
  register(freeContainerMaterial, FreeContainerMaterial)
}
