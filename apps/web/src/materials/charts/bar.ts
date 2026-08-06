import { barChartDescriptor } from '@ai-design/materials'
import { defineMaterial } from '@/materials/defineMaterial.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'
import {
  cartesianChartSetters,
  chartMaterialIcons,
  commonChartSetters,
} from '@/materials/charts/shared.ts'

export const barMaterial = defineMaterial(barChartDescriptor, {
  icon: chartMaterialIcons.bar,
  preview: {
    component: ChartPreview,
    props: { variant: 'bar' },
  },
  setters: [
    ...commonChartSetters,
    {
      component: 'themeColor',
      label: '渐变顶部',
      field: 'props.option.series.0.itemStyle.color.colorStops.0.color',
      span: 12,
      props: { showAlpha: true },
    },
    {
      component: 'themeColor',
      label: '渐变底部',
      field: 'props.option.series.0.itemStyle.color.colorStops.1.color',
      span: 12,
      props: { showAlpha: true },
    },
    {
      component: 'number',
      label: '柱体宽度',
      field: 'props.option.series.0.barWidth',
      span: 12,
      props: { min: 4, max: 80 },
    },
    {
      component: 'number',
      label: '柱体圆角',
      field: 'props.option.series.0.itemStyle.borderRadius',
      span: 12,
      props: { min: 0, max: 30 },
    },
    {
      component: 'switch',
      label: '显示数值',
      field: 'props.option.series.0.label.show',
      span: 12,
    },
    {
      component: 'commonSelect',
      label: '数值位置',
      field: 'props.option.series.0.label.position',
      span: 12,
      props: {
        options: [
          { label: '柱体顶部', value: 'top' },
          { label: '柱体内部', value: 'inside' },
          { label: '内部顶部', value: 'insideTop' },
        ],
      },
    },
    ...cartesianChartSetters,
  ],
  dataBindings: [
    { label: '分类轴 X', field: 'props.option.series.0.encode.x' },
    { label: '数值轴 Y', field: 'props.option.series.0.encode.y' },
  ],
})
