import { createThemeColorReference } from '@ai-design/contracts'
import type { MaterialDescriptor } from '../descriptor.js'

export const annotationNoteDescriptor: MaterialDescriptor = {
  key: 'annotation-note',
  type: 'annotation-note',
  name: '自由备注',
  group: 'annotation',
  description: '带标题和正文的备注卡片,用于在画布上说明改动内容。不参与页面渲染逻辑。',
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
  },
  template: {
    type: 'annotation-note',
    name: '自由备注',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 280,
      height: 150,
    },
    style: {
      accentColor: createThemeColorReference('primary'),
      backgroundColor: createThemeColorReference('container-background'),
      color: createThemeColorReference('text-primary'),
      borderRadius: 6,
      fontSize: 14,
      padding: 14,
    },
    props: {
      title: '自由备注',
      content: '在这里填写具体的改动说明。',
    },
    events: [],
  },
}

interface AnnotationFramePreset {
  key: string
  name: string
  label: string
  color: string
  backgroundColor: string
  borderStyle: 'solid' | 'dashed'
}

/**
 * 四个标注框预设共用 `annotation-frame` 这一个 type(同一个渲染组件),
 * 靠 `key` 区分。已保存的页面里存的是 type,所以不能拆成四个 type。
 */
const annotationFramePresets: AnnotationFramePreset[] = [
  {
    key: 'annotation-frame-feature',
    name: '新特性',
    label: '新特性',
    color: '#16a36a',
    backgroundColor: 'rgba(22, 163, 106, 0.07)',
    borderStyle: 'solid',
  },
  {
    key: 'annotation-frame-changed',
    name: '功能改动',
    label: '功能改动',
    color: '#e58a17',
    backgroundColor: 'rgba(229, 138, 23, 0.07)',
    borderStyle: 'dashed',
  },
  {
    key: 'annotation-frame-removed',
    name: '功能移除',
    label: '功能移除',
    color: '#dc4c4c',
    backgroundColor: 'rgba(220, 76, 76, 0.07)',
    borderStyle: 'dashed',
  },
  {
    key: 'annotation-frame-custom',
    name: '自定义标注',
    label: '标注',
    color: '#3978f6',
    backgroundColor: 'rgba(57, 120, 246, 0.07)',
    borderStyle: 'solid',
  },
]

function createAnnotationFrameDescriptor(preset: AnnotationFramePreset): MaterialDescriptor {
  return {
    key: preset.key,
    type: 'annotation-frame',
    name: preset.name,
    group: 'annotation',
    description: `用于圈出页面区域的${preset.name}标注框,不参与页面渲染逻辑。`,
    capability: {
      kind: 'leaf',
      roles: ['canvas-content'],
    },
    template: {
      type: 'annotation-frame',
      name: `${preset.name}标注`,
      placement: {
        type: 'absolute',
        x: 0,
        y: 0,
        width: 320,
        height: 180,
      },
      style: {
        color: preset.color,
        backgroundColor: preset.backgroundColor,
        borderRadius: 4,
        borderStyle: preset.borderStyle,
        borderWidth: 2,
      },
      props: {
        label: preset.label,
        description: '',
      },
      events: [],
    },
  }
}

export const annotationFrameDescriptors: MaterialDescriptor[] =
  annotationFramePresets.map(createAnnotationFrameDescriptor)
