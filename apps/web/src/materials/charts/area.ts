import { areaChartDescriptor } from '@ai-design/materials'
import { defineMaterial } from '@/materials/defineMaterial.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'
import {
  cartesianChartSetters,
  chartMaterialIcons,
  commonChartSetters,
} from '@/materials/charts/shared.ts'

export const areaMaterial = defineMaterial(areaChartDescriptor, {
  icon: chartMaterialIcons.area,
  preview: {
    component: ChartPreview,
    props: { variant: 'area' },
  },
  setters: [
    ...commonChartSetters,
    {
      component: 'themeColor',
      label: '轮廓颜色',
      field: 'props.option.color.0',
      span: 24,
    },
    {
      component: 'themeColor',
      label: '渐变顶部',
      field: 'props.option.series.0.areaStyle.color.colorStops.0.color',
      span: 12,
      props: { showAlpha: true },
    },
    {
      component: 'themeColor',
      label: '渐变底部',
      field: 'props.option.series.0.areaStyle.color.colorStops.1.color',
      span: 12,
      props: { showAlpha: true },
    },
    {
      component: 'number',
      label: '填充透明度',
      field: 'props.option.series.0.areaStyle.opacity',
      span: 12,
      props: { min: 0, max: 1, step: 0.05, precision: 2 },
    },
    {
      component: 'number',
      label: '轮廓宽度',
      field: 'props.option.series.0.lineStyle.width',
      span: 12,
      props: { min: 0, max: 10 },
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
    ...cartesianChartSetters,
  ],
  dataBindings: [
    { label: '分类轴 X', field: 'props.option.series.0.encode.x' },
    { label: '数值轴 Y', field: 'props.option.series.0.encode.y' },
  ],
})
