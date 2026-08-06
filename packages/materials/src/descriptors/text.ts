import { createThemeColorReference } from '@ai-design/contracts'
import type { MaterialDescriptor } from '../descriptor.js'

export const textDescriptor: MaterialDescriptor = {
  key: 'text',
  type: 'text',
  name: '标题文本',
  group: 'info',
  description: '展示一段静态文字,支持字体、字号、颜色、对齐与斜体等排版设置。',
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
  },
  template: {
    type: 'text',
    name: '标题文本',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 460,
      height: 92,
    },
    style: {
      color: createThemeColorReference('text-primary'),
      backgroundColor: '',
      fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: -0.5,
      textAlign: 'left',
      padding: 18,
      borderRadius: 12,
    },
    props: {
      content: 'hello world',
      verticalAlign: 'center',
      italic: false,
      underline: false,
      shadow: true,
      wrap: true,
    },
    events: [],
  },
}

export const timeDescriptor: MaterialDescriptor = {
  key: 'time',
  type: 'time',
  name: '当前时间',
  group: 'info',
  description: '实时显示当前日期时间,可选显示格式、星期与滚动动画。',
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
  },
  template: {
    type: 'time',
    name: '当前时间',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 360,
      height: 72,
    },
    style: {
      color: createThemeColorReference('text-primary'),
      backgroundColor: '',
      fontFamily: '"DIN Alternate", "Arial Narrow", Arial, sans-serif',
      fontSize: 26,
      fontWeight: 600,
      letterSpacing: 1,
      textAlign: 'left',
      padding: 16,
      borderRadius: 10,
    },
    props: {
      format: 'YYYY-MM-DD HH:mm:ss',
      showWeekday: false,
      animated: true,
    },
    events: [],
  },
}
