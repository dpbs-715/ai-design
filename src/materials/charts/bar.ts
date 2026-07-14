import { type MaterialDefinition } from '@/schema/material.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'

export const barMaterial: MaterialDefinition = {
  name: '柱状图',
  group: 'charts',
  preview: {
    component: ChartPreview,
    props: { variant: 'bar' },
  },
  setters: [
    {
      component: 'input',
      label: '标题',
      field: 'props.option.title.text',
    },
    {
      component: 'color',
      label: '标题色',
      field: 'props.option.title.textStyle.color',
    },
    {
      component: 'checkbox',
      label: '图例显示',
      field: 'props.option.legend.show',
    },
    {
      component: 'commonSelect',
      label: '对齐',
      field: 'props.option.title.left',
      props: {
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
        ],
      },
    },
    {
      component: 'color',
      label: '柱颜色',
      field: 'props.option.series.0.itemStyle.color',
    },
    {
      component: 'input',
      label: 'X字段',
      field: 'props.option.series.0.encode.x',
    },
    {
      component: 'input',
      label: 'Y字段',
      field: 'props.option.series.0.encode.y',
    },
    {
      component: 'number',
      label: '上边距',
      field: 'props.option.grid.top',
      span: 12,
    },
    {
      component: 'number',
      label: '右边距',
      field: 'props.option.grid.right',
      span: 12,
    },
    {
      component: 'number',
      label: '下边距',
      field: 'props.option.grid.bottom',
      span: 12,
    },
    {
      component: 'number',
      label: '左边距',
      field: 'props.option.grid.left',
      span: 12,
    },
  ],
  schema: {
    type: 'bar-chart',
    name: '柱状图',
    layout: {
      x: 0,
      y: 0,
      width: 400,
      height: 260,
    },
    props: {
      option: {
        legend: {
          top: 38,
          left: 'center',
          itemWidth: 12,
          itemHeight: 8,
          show: true,
          textStyle: {
            color: '#cbd5e1',
          },
        },
        title: {
          text: '销售额统计',
          top: 8,
          left: 'center',
          textStyle: {
            color: '#ffffff',
            fontSize: 16,
          },
        },
        tooltip: {},
        dataset: {
          source: [
            { label: '一月', value: 120 },
            { label: '二月', value: 200 },
            { label: '三月', value: 150 },
            { label: '四月', value: 80 },
            { label: '五月', value: 170 },
            { label: '六月', value: 240 },
          ],
        },
        grid: {
          top: 86,
          right: 24,
          bottom: 32,
          left: 48,
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          axisLine: {
            lineStyle: {
              color: '#64748b',
            },
          },
          axisLabel: {
            color: '#cbd5e1',
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#cbd5e1',
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(148, 163, 184, 0.18)',
            },
          },
        },
        series: [
          {
            name: '销售额',
            type: 'bar',
            barWidth: '45%',
            encode: {
              x: 'label',
              y: 'value',
            },
            itemStyle: {
              color: '#22d3ee',
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      },
    },
  },
}
