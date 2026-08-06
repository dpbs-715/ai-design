import { pieChartDescriptor } from '@ai-design/materials'
import { defineMaterial } from '@/materials/defineMaterial.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'
import { chartMaterialIcons, commonChartSetters } from '@/materials/charts/shared.ts'

export const pieMaterial = defineMaterial(pieChartDescriptor, {
  icon: chartMaterialIcons.pie,
  preview: {
    component: ChartPreview,
    props: { variant: 'pie' },
  },
  setters: [
    ...commonChartSetters,
    {
      component: 'themeColor',
      label: '主色',
      field: 'props.option.color.0',
      span: 12,
    },
    {
      component: 'themeColor',
      label: '辅助色',
      field: 'props.option.color.1',
      span: 12,
    },
    {
      component: 'themeColor',
      label: '强调色',
      field: 'props.option.color.2',
      span: 12,
    },
    {
      component: 'input',
      label: '内径',
      field: 'props.option.series.0.radius.0',
      span: 12,
      props: { placeholder: '例如 48%' },
    },
    {
      component: 'input',
      label: '外径',
      field: 'props.option.series.0.radius.1',
      span: 12,
      props: { placeholder: '例如 72%' },
    },
    {
      component: 'number',
      label: '起始角度',
      field: 'props.option.series.0.startAngle',
      span: 12,
      props: { min: 0, max: 360 },
    },
    {
      component: 'number',
      label: '扇区间距',
      field: 'props.option.series.0.padAngle',
      span: 12,
      props: { min: 0, max: 12 },
    },
    {
      component: 'number',
      label: '扇区圆角',
      field: 'props.option.series.0.itemStyle.borderRadius',
      span: 12,
      props: { min: 0, max: 20 },
    },
    {
      component: 'switch',
      label: '显示标签',
      field: 'props.option.series.0.label.show',
      span: 12,
    },
    {
      component: 'commonSelect',
      label: '标签位置',
      field: 'props.option.series.0.label.position',
      span: 12,
      props: {
        options: [
          { label: '环形外侧', value: 'outside' },
          { label: '环形内部', value: 'inside' },
          { label: '中心', value: 'center' },
        ],
      },
    },
    {
      component: 'commonSelect',
      label: '图例方向',
      field: 'props.option.legend.orient',
      span: 12,
      props: {
        options: [
          { label: '垂直', value: 'vertical' },
          { label: '水平', value: 'horizontal' },
        ],
      },
    },
  ],
  dataBindings: [
    { label: '名称字段', field: 'props.option.series.0.encode.itemName' },
    { label: '数值字段', field: 'props.option.series.0.encode.value' },
  ],
})
