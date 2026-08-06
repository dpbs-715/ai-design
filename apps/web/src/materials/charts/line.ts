import { lineChartDescriptor } from '@ai-design/materials'
import { defineMaterial } from '@/materials/defineMaterial.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'
import {
  cartesianChartSetters,
  chartMaterialIcons,
  commonChartSetters,
} from '@/materials/charts/shared.ts'

export const lineMaterial = defineMaterial(lineChartDescriptor, {
  icon: chartMaterialIcons.line,
  preview: {
    component: ChartPreview,
    props: { variant: 'line' },
  },
  setters: [
    ...commonChartSetters,
    {
      component: 'themeColor',
      label: '折线颜色',
      field: 'props.option.series.0.lineStyle.color',
      span: 12,
    },
    {
      component: 'themeColor',
      label: '节点颜色',
      field: 'props.option.series.0.itemStyle.borderColor',
      span: 12,
    },
    {
      component: 'number',
      label: '线条宽度',
      field: 'props.option.series.0.lineStyle.width',
      span: 12,
      props: { min: 1, max: 10 },
    },
    {
      component: 'commonSelect',
      label: '线条样式',
      field: 'props.option.series.0.lineStyle.type',
      span: 12,
      props: {
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
        ],
      },
    },
    {
      component: 'switch',
      label: '平滑曲线',
      field: 'props.option.series.0.smooth',
      span: 12,
    },
    {
      component: 'switch',
      label: '显示节点',
      field: 'props.option.series.0.showSymbol',
      span: 12,
    },
    {
      component: 'number',
      label: '节点大小',
      field: 'props.option.series.0.symbolSize',
      span: 24,
      props: { min: 2, max: 24 },
    },
    ...cartesianChartSetters,
  ],
  dataBindings: [
    { label: '分类轴 X', field: 'props.option.series.0.encode.x' },
    { label: '数值轴 Y', field: 'props.option.series.0.encode.y' },
  ],
})
