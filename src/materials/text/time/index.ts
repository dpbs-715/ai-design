import type { MaterialDefinition } from '@/schema/material.ts'
import TimePreview from '@/materials/previews/TimePreview.vue'
import { commonTextStyleSetters } from '@/materials/text/shared.ts'
import { createThemeColorReference } from '@/theme/renderTheme.ts'

const formatOptions = [
  { label: '日期 + 时间', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: '仅日期', value: 'YYYY-MM-DD' },
  { label: '仅时间', value: 'HH:mm:ss' },
  { label: '中文日期时间', value: 'YYYY年MM月DD日 HH:mm' },
  { label: '短日期时间', value: 'MM-DD HH:mm' },
]

export const timeMaterial: MaterialDefinition = {
  name: '当前时间',
  group: 'info',
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
  schema: {
    type: 'time',
    name: '当前时间',
    layout: {
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
