import type { MaterialDescriptor } from '../descriptor.js'

/** 弹窗标题栏高度。 */
export const dialogHeaderHeight = 52

/** 弹窗内容区最小高度。 */
export const minimumDialogContentHeight = 120

/** 弹窗整体最小高度 —— 标题栏加内容区。 */
export const minimumDialogHeight = dialogHeaderHeight + minimumDialogContentHeight

export const dialogDescriptor: MaterialDescriptor = {
  key: 'dialog-container',
  type: 'dialog-container',
  name: '弹窗容器',
  group: 'container',
  description: '浮层弹窗,可放置其他物料。只能挂在页面根节点下,不能嵌在普通容器里。',
  capability: {
    kind: 'container',
    roles: ['page-overlay'],
    accepts: ['canvas-content'],
  },
  resizeConstraints: {
    minHeight: minimumDialogHeight,
  },
  template: {
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
