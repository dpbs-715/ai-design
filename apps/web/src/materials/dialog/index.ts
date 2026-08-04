import type { MaterialDefinition } from '@/schema/material.ts'
import DialogMaterial from './component.vue'
import DialogMaterialEditor from './editor.vue'
import DialogMaterialPreview from './preview.vue'
import { minimumDialogHeight } from './config.ts'

export const dialogMaterial: MaterialDefinition = {
  name: '弹窗容器',
  group: 'container',
  icon: 'fluent:window-20-regular',
  preview: {
    component: DialogMaterialPreview,
  },
  capability: {
    kind: 'container',
    roles: ['page-overlay'],
    accepts: ['canvas-content'],
  },
  editorComponent: DialogMaterialEditor,
  resizeConstraints: {
    minHeight: minimumDialogHeight,
  },
  setters: [
    {
      component: 'input',
      label: '弹窗标题',
      field: 'props.title',
      span: 24,
      props: { maxlength: 80, placeholder: '输入弹窗标题' },
    },
    {
      component: 'switch',
      label: '默认打开',
      field: 'props.defaultOpen',
      span: 12,
    },
    {
      component: 'switch',
      label: '显示关闭按钮',
      field: 'props.showClose',
      span: 12,
    },
    {
      component: 'switch',
      label: '显示遮罩',
      field: 'props.modal',
      span: 12,
    },
    {
      component: 'switch',
      label: '遮罩模糊',
      field: 'props.modalBlur',
      span: 12,
    },
    {
      component: 'switch',
      label: '点击遮罩关闭',
      field: 'props.closeOnClickModal',
      span: 12,
    },
    {
      component: 'switch',
      label: '按 ESC 关闭',
      field: 'props.closeOnPressEscape',
      span: 12,
    },
    {
      component: 'switch',
      label: '允许拖动弹窗',
      field: 'props.draggable',
      span: 12,
    },
    {
      component: 'switch',
      label: '裁剪内容',
      field: 'childrenLayout.clip',
      span: 12,
    },
  ],
  customEventOptions: [
    { label: '弹窗开始打开', value: 'open' },
    { label: '弹窗打开完成', value: 'opened' },
    { label: '弹窗开始关闭', value: 'close' },
    { label: '弹窗关闭完成', value: 'closed' },
  ],
  schema: {
    type: 'dialog-container',
    name: '弹窗',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 720,
      height: 480,
    },
    childrenLayout: {
      type: 'absolute',
      clip: true,
    },
    props: {
      title: '弹窗标题',
      defaultOpen: false,
      showClose: true,
      modal: true,
      modalBlur: true,
      closeOnClickModal: false,
      closeOnPressEscape: true,
      draggable: false,
    },
    events: [],
  },
}

export function install(register) {
  register(dialogMaterial, DialogMaterial)
}
