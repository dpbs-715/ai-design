import type { MaterialDefinition } from '@/schema/material.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'
import {
  cartesianChartSetters,
  commonChartSetters,
  createCartesianOption,
} from '@/materials/charts/shared.ts'

export const areaMaterial: MaterialDefinition = {
  name: '面积图',
  group: 'charts',
  preview: {
    component: ChartPreview,
    props: { variant: 'area' },
  },
  setters: [
    ...commonChartSetters,
    {
      component: 'color',
      label: '轮廓颜色',
      field: 'props.option.color.0',
      span: 24,
    },
    {
      component: 'color',
      label: '渐变顶部',
      field: 'props.option.series.0.areaStyle.color.colorStops.0.color',
      span: 12,
      props: { showAlpha: true },
    },
    {
      component: 'color',
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
  schema: {
    type: 'area-chart',
    name: '面积图',
    layout: {
      x: 0,
      y: 0,
      width: 420,
      height: 260,
    },
    props: {
      option: {
        ...createCartesianOption('累计成交额'),
        color: ['#22d3ee'],
        dataset: {
          source: [
            { label: '1月', value: 86 },
            { label: '2月', value: 112 },
            { label: '3月', value: 164 },
            { label: '4月', value: 218 },
            { label: '5月', value: 286 },
            { label: '6月', value: 378 },
            { label: '7月', value: 452 },
          ],
        },
        xAxis: {
          ...createCartesianOption('').xAxis,
          boundaryGap: false,
        },
        series: [
          {
            name: '成交额',
            type: 'line',
            smooth: true,
            showSymbol: false,
            symbol: 'circle',
            symbolSize: 6,
            encode: {
              x: 'label',
              y: 'value',
            },
            lineStyle: {
              width: 2,
              cap: 'round',
              shadowColor: 'rgba(34, 211, 238, 0.32)',
              shadowBlur: 10,
            },
            areaStyle: {
              opacity: 0.9,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(34, 211, 238, 0.52)' },
                  { offset: 1, color: 'rgba(34, 211, 238, 0.02)' },
                ],
              },
            },
            emphasis: {
              focus: 'series',
            },
          },
        ],
      },
    },
  },
}
