import type { MaterialDescriptor } from '../descriptor.js'

export const imageDescriptor: MaterialDescriptor = {
  key: 'image',
  type: 'image',
  name: '图片',
  group: 'media',
  description: '展示图片,支持 URL 或 Base64 来源、填充方式与透明度。',
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
  },
  template: {
    type: 'image',
    name: '图片',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 320,
      height: 200,
    },
    style: {
      backgroundColor: '',
      borderRadius: 8,
      borderWidth: 0,
      borderColor: '',
    },
    props: {
      src: '/image-placeholder.svg',
      alt: '',
      fit: 'cover',
      opacity: 1,
    },
    events: [],
  },
}
