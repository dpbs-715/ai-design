import type { MaterialDefinition } from '@/schema/material.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'
import {
  cartesianChartSetters,
  chartMaterialIcons,
  commonChartSetters,
  createCartesianOption,
} from '@/materials/charts/shared.ts'
import { createThemeColorReference } from '@/theme/renderTheme.ts'

export const lineMaterial: MaterialDefinition = {
  name: '折线图',
  group: 'charts',
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
  schema: {
    type: 'line-chart',
    name: '折线图',
    layout: {
      x: 0,
      y: 0,
      width: 420,
      height: 260,
    },
    props: {
      option: {
        ...createCartesianOption('实时访问趋势'),
        color: [createThemeColorReference('primary')],
        dataset: {
          source: [
            { label: '08:00', value: 420 },
            { label: '10:00', value: 680 },
            { label: '12:00', value: 590 },
            { label: '14:00', value: 960 },
            { label: '16:00', value: 810 },
            { label: '18:00', value: 1240 },
            { label: '20:00', value: 1080 },
          ],
        },
        xAxis: {
          ...createCartesianOption('').xAxis,
          boundaryGap: false,
        },
        series: [
          {
            name: '访问量',
            type: 'line',
            smooth: false,
            showSymbol: true,
            symbol: 'circle',
            symbolSize: 7,
            encode: {
              x: 'label',
              y: 'value',
            },
            lineStyle: {
              width: 3,
              type: 'solid',
              color: createThemeColorReference('primary'),
              cap: 'round',
              join: 'round',
              shadowColor: createThemeColorReference('primary'),
              shadowBlur: 10,
            },
            itemStyle: {
              color: createThemeColorReference('page-background'),
              borderColor: createThemeColorReference('primary'),
              borderWidth: 2,
            },
            emphasis: {
              focus: 'series',
              scale: 1.5,
            },
            markPoint: {
              symbol: 'pin',
              symbolSize: 34,
              label: {
                color: createThemeColorReference('page-background'),
                fontSize: 10,
              },
              itemStyle: {
                color: createThemeColorReference('primary'),
              },
            },
          },
        ],
      },
    },
  },
}
