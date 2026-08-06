import { timeDescriptor } from '@ai-design/materials'
import { defineMaterial } from '@/materials/defineMaterial.ts'
import TimePreview from '@/materials/previews/TimePreview.vue'
import { commonTextStyleSetters } from '@/materials/text/shared.ts'

const formatOptions = [
  { label: '日期 + 时间', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: '仅日期', value: 'YYYY-MM-DD' },
  { label: '仅时间', value: 'HH:mm:ss' },
  { label: '中文日期时间', value: 'YYYY年MM月DD日 HH:mm' },
  { label: '短日期时间', value: 'MM-DD HH:mm' },
]

export const timeMaterial = defineMaterial(timeDescriptor, {
  icon: 'fluent:clock-20-filled',
  preview: {
    component: TimePreview,
  },
  setters: [
    {
      component: 'commonSelect',
      label: '显示格式',
      field: 'props.format',
      span: 24,
      props: { options: formatOptions },
    },
    {
      component: 'switch',
      label: '显示星期',
      field: 'props.showWeekday',
      span: 12,
    },
    {
      component: 'switch',
      label: '滚动动画',
      field: 'props.animated',
      span: 12,
    },
    ...commonTextStyleSetters,
  ],
  customEventOptions: [],
})
