import type { MaterialDefinition } from '@/schema/material.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'
import {
  cartesianChartSetters,
  commonChartSetters,
  createCartesianOption,
} from '@/materials/charts/shared.ts'

export const barMaterial: MaterialDefinition = {
  name: '柱状图',
  group: 'charts',
  preview: {
    component: ChartPreview,
    props: { variant: 'bar' },
  },
  setters: [
    ...commonChartSetters,
    {
      component: 'color',
      label: '渐变顶部',
      field: 'props.option.series.0.itemStyle.color.colorStops.0.color',
      span: 12,
      props: { showAlpha: true },
    },
    {
      component: 'color',
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
  schema: {
    type: 'bar-chart',
    name: '柱状图',
    layout: {
      x: 0,
      y: 0,
      width: 420,
      height: 260,
    },
    props: {
      option: {
        ...createCartesianOption('渠道转化量'),
        dataset: {
          source: [
            { label: '搜索', value: 186 },
            { label: '推荐', value: 268 },
            { label: '社媒', value: 214 },
            { label: '活动', value: 336 },
            { label: '自然', value: 292 },
            { label: '其他', value: 148 },
          ],
        },
        series: [
          {
            name: '转化量',
            type: 'bar',
            barWidth: 24,
            encode: {
              x: 'label',
              y: 'value',
            },
            label: {
              show: false,
              position: 'top',
              color: '#cbd5e1',
              fontSize: 11,
            },
            itemStyle: {
              borderRadius: 6,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#7c8cff' },
                  { offset: 1, color: '#4f5bd5' },
                ],
              },
            },
            emphasis: {
              itemStyle: {
                shadowColor: 'rgba(124, 140, 255, 0.34)',
                shadowBlur: 14,
              },
            },
          },
        ],
      },
    },
  },
}
