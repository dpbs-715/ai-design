import type { MaterialSetter } from '@/schema/material.ts'

const alignmentOptions = [
  { label: '左对齐', value: 20 },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
]

export const commonChartSetters: MaterialSetter[] = [
  {
    component: 'input',
    label: '标题',
    field: 'props.option.title.text',
    span: 24,
  },
  {
    component: 'switch',
    label: '显示标题',
    field: 'props.option.title.show',
    span: 12,
  },
  {
    component: 'switch',
    label: '显示图例',
    field: 'props.option.legend.show',
    span: 12,
  },
  {
    component: 'commonSelect',
    label: '标题对齐',
    field: 'props.option.title.left',
    span: 12,
    props: { options: alignmentOptions },
  },
  {
    component: 'number',
    label: '标题字号',
    field: 'props.option.title.textStyle.fontSize',
    span: 12,
    props: { min: 12, max: 40 },
  },
  {
    component: 'color',
    label: '标题颜色',
    field: 'props.option.title.textStyle.color',
    span: 12,
  },
  {
    component: 'color',
    label: '背景颜色',
    field: 'props.option.backgroundColor',
    span: 12,
    props: { showAlpha: true },
  },
  {
    component: 'switch',
    label: '开启动画',
    field: 'props.option.animation',
    span: 12,
  },
  {
    component: 'switch',
    label: '显示提示',
    field: 'props.option.tooltip.show',
    span: 12,
  },
]

export const cartesianChartSetters: MaterialSetter[] = [
  {
    component: 'switch',
    label: '横轴标签',
    field: 'props.option.xAxis.axisLabel.show',
    span: 12,
  },
  {
    component: 'switch',
    label: '纵轴标签',
    field: 'props.option.yAxis.axisLabel.show',
    span: 12,
  },
  {
    component: 'color',
    label: '横轴文字色',
    field: 'props.option.xAxis.axisLabel.color',
    span: 12,
  },
  {
    component: 'color',
    label: '纵轴文字色',
    field: 'props.option.yAxis.axisLabel.color',
    span: 12,
  },
  {
    component: 'switch',
    label: '辅助网格线',
    field: 'props.option.yAxis.splitLine.show',
    span: 24,
  },
  {
    component: 'number',
    label: '上边距',
    field: 'props.option.grid.top',
    span: 12,
    props: { min: 0 },
  },
  {
    component: 'number',
    label: '右边距',
    field: 'props.option.grid.right',
    span: 12,
    props: { min: 0 },
  },
  {
    component: 'number',
    label: '下边距',
    field: 'props.option.grid.bottom',
    span: 12,
    props: { min: 0 },
  },
  {
    component: 'number',
    label: '左边距',
    field: 'props.option.grid.left',
    span: 12,
    props: { min: 0 },
  },
]

export function createChartBaseOption(title: string) {
  return {
    backgroundColor: 'rgba(13, 16, 21, 0)',
    animation: true,
    animationDuration: 700,
    animationEasing: 'cubicOut',
    title: {
      show: true,
      text: title,
      top: 16,
      left: 20,
      textStyle: {
        color: '#f1f5f9',
        fontSize: 16,
        fontWeight: 600,
      },
    },
    legend: {
      show: false,
      top: 20,
      right: 20,
      itemWidth: 8,
      itemHeight: 8,
      icon: 'circle',
      textStyle: {
        color: '#94a3b8',
      },
    },
    tooltip: {
      show: true,
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderColor: 'rgba(148, 163, 184, 0.24)',
      borderWidth: 1,
      padding: [10, 12],
      textStyle: {
        color: '#e2e8f0',
        fontSize: 12,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.45)',
          type: 'dashed',
        },
      },
    },
  }
}

export function createCartesianOption(title: string) {
  return {
    ...createChartBaseOption(title),
    grid: {
      top: 70,
      right: 26,
      bottom: 24,
      left: 24,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      axisLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.28)',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: true,
        color: '#8793a5',
        fontSize: 11,
        margin: 12,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: true,
        color: '#8793a5',
        fontSize: 11,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.14)',
          type: 'dashed',
        },
      },
    },
  }
}
