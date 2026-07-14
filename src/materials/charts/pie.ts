import type { MaterialDefinition } from '@/schema/material.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'

export const pieMaterial: MaterialDefinition = {
  name: '饼图',
  group: 'charts',
  preview: {
    component: ChartPreview,
    props: { variant: 'pie' },
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
      component: 'select',
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
      label: '主色',
      field: 'props.option.color.0',
    },
    {
      component: 'input',
      label: '名称字段',
      field: 'props.option.series.0.encode.itemName',
    },
    {
      component: 'input',
      label: '数值字段',
      field: 'props.option.series.0.encode.value',
    },
  ],
  schema: {
    type: 'pie-chart',
    name: '饼图',
    layout: {
      x: 0,
      y: 0,
      width: 400,
      height: 260,
    },
    props: {
      option: {
        color: ['#22d3ee', '#a78bfa', '#f59e0b', '#34d399', '#fb7185'],
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
          text: '访问来源占比',
          top: 8,
          left: 'center',
          textStyle: {
            color: '#ffffff',
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: 'item',
        },
        dataset: {
          source: [
            { label: '搜索引擎', value: 1048 },
            { label: '直接访问', value: 735 },
            { label: '联盟广告', value: 484 },
            { label: '视频广告', value: 300 },
          ],
        },
        series: [
          {
            name: '访问来源',
            type: 'pie',
            center: ['50%', '62%'],
            avoidLabelOverlap: true,
            label: {
              color: '#e2e8f0',
            },
            labelLine: {
              lineStyle: {
                color: '#94a3b8',
              },
            },
            encode: {
              itemName: 'label',
              value: 'value',
            },
          },
        ],
      },
    },
  },
}
