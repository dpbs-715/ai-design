import type { MaterialDefinition } from '@/schema/material.ts'

export const lineMaterial: MaterialDefinition = {
  name: '折线图',
  group: 'charts',
  icon: 'fluent-color:list-bar-16',
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
      label: '线颜色',
      field: 'props.option.series.0.lineStyle.color',
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
    type: 'line-chart',
    name: '折线图',
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
          text: '访问量趋势',
          top: 8,
          left: 'center',
          textStyle: {
            color: '#ffffff',
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: 'axis',
        },
        dataset: {
          source: [
            { label: '周一', value: 820 },
            { label: '周二', value: 932 },
            { label: '周三', value: 901 },
            { label: '周四', value: 934 },
            { label: '周五', value: 1290 },
            { label: '周六', value: 1330 },
            { label: '周日', value: 1320 },
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
          boundaryGap: false,
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
            name: '访问量',
            type: 'line',
            smooth: true,
            symbolSize: 8,
            encode: {
              x: 'label',
              y: 'value',
            },
            lineStyle: {
              width: 3,
              color: '#38bdf8',
            },
            itemStyle: {
              color: '#38bdf8',
            },
          },
        ],
      },
    },
  },
}
