import type { MaterialDescriptor } from '../descriptor.js'

export const buttonDescriptor: MaterialDescriptor = {
  key: 'button',
  type: 'button',
  name: '按钮',
  group: 'interaction',
  description: '可点击的按钮,用于触发操作。支持类型、尺寸、图标、禁用与加载状态。',
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
  },
  template: {
    type: 'button',
    name: '按钮',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 144,
      height: 44,
    },
    props: {
      text: '按钮',
      variant: 'primary',
      size: 'medium',
      icon: '',
      disabled: false,
      loading: false,
      plain: false,
      round: false,
    },
    events: [
      {
        type: 'click',
        name: 'onClick',
        title: '点击事件',
        code: '',
      },
    ],
  },
}
