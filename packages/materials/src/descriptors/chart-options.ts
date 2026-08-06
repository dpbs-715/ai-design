import { createThemeColorReference } from '@ai-design/contracts'

/** 所有图表共用的基础 option —— 标题、图例、提示框、动画。 */
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
        color: createThemeColorReference('text-primary'),
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
        color: createThemeColorReference('text-secondary'),
      },
    },
    tooltip: {
      show: true,
      trigger: 'axis',
      backgroundColor: createThemeColorReference('container-background'),
      borderColor: createThemeColorReference('border'),
      borderWidth: 1,
      padding: [10, 12],
      textStyle: {
        color: createThemeColorReference('text-primary'),
        fontSize: 12,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: createThemeColorReference('border'),
          type: 'dashed',
        },
      },
    },
  }
}

/** 直角坐标系图表(柱状图/折线图/面积图)的基础 option —— 追加 grid 与 x/y 轴。 */
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
          color: createThemeColorReference('border'),
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: true,
        color: createThemeColorReference('text-secondary'),
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
        color: createThemeColorReference('text-secondary'),
        fontSize: 11,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: createThemeColorReference('border'),
          type: 'dashed',
        },
      },
    },
  }
}
