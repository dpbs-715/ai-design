import { createThemeColorReference } from '@ai-design/contracts'
import type { MaterialDescriptor } from '../descriptor.js'

export const freeContainerDescriptor: MaterialDescriptor = {
  key: 'free-container',
  type: 'free-container',
  name: '自由容器',
  group: 'container',
  description: '可放置其他物料的自由布局容器,用于分组与嵌套排版。子节点使用绝对定位。',
  capability: {
    kind: 'container',
    roles: ['canvas-content'],
    accepts: ['canvas-content'],
  },
  template: {
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
