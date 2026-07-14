import type { MaterialDefinition } from '@/schema/material.ts'
import ChartPreview from '@/materials/previews/ChartPreview.vue'
import { commonChartSetters, createChartBaseOption } from '@/materials/charts/shared.ts'

export const pieMaterial: MaterialDefinition = {
  name: '饼图',
  group: 'charts',
  preview: {
    component: ChartPreview,
    props: { variant: 'pie' },
  },
  setters: [
    ...commonChartSetters,
    {
      component: 'color',
      label: '主色',
      field: 'props.option.color.0',
      span: 8,
    },
    {
      component: 'color',
      label: '辅助色',
      field: 'props.option.color.1',
      span: 8,
    },
    {
      component: 'color',
      label: '强调色',
      field: 'props.option.color.2',
      span: 8,
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
  schema: {
    type: 'pie-chart',
    name: '饼图',
    layout: {
      x: 0,
      y: 0,
      width: 420,
      height: 260,
    },
    props: {
      option: {
        ...createChartBaseOption('流量来源构成'),
        color: ['#7c8cff', '#22d3ee', '#fbbf24', '#34d399', '#fb7185'],
        legend: {
          show: true,
          orient: 'vertical',
          top: 'middle',
          right: 22,
          itemWidth: 8,
          itemHeight: 8,
          itemGap: 15,
          icon: 'circle',
          textStyle: {
            color: '#94a3b8',
            fontSize: 11,
          },
        },
        tooltip: {
          ...createChartBaseOption('').tooltip,
          trigger: 'item',
        },
        dataset: {
          source: [
            { label: '内容推荐', value: 42 },
            { label: '搜索访问', value: 28 },
            { label: '营销活动', value: 18 },
            { label: '直接访问', value: 12 },
          ],
        },
        series: [
          {
            name: '流量来源',
            type: 'pie',
            center: ['38%', '58%'],
            radius: ['48%', '72%'],
            startAngle: 96,
            padAngle: 3,
            minAngle: 6,
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 7,
              borderColor: '#151a21',
              borderWidth: 2,
            },
            label: {
              show: false,
              position: 'outside',
              color: '#cbd5e1',
              fontSize: 11,
            },
            labelLine: {
              length: 10,
              length2: 8,
              lineStyle: {
                color: '#64748b',
              },
            },
            emphasis: {
              scaleSize: 6,
              label: {
                show: true,
                fontWeight: 600,
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
