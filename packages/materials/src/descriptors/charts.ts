import { createThemeColorReference } from '@ai-design/contracts'
import type { MaterialCapability, MaterialDescriptor } from '../descriptor.js'
import { createCartesianOption, createChartBaseOption } from './chart-options.js'

/** 图表都是叶子节点,不接纳子节点。 */
const chartCapability: MaterialCapability = {
  kind: 'leaf',
  roles: ['canvas-content'],
}

/** 图表统一的画布尺寸。 */
const chartPlacement = {
  type: 'absolute' as const,
  x: 0,
  y: 0,
  width: 420,
  height: 260,
}

export const barChartDescriptor: MaterialDescriptor = {
  key: 'bar-chart',
  type: 'bar-chart',
  name: '柱状图',
  group: 'charts',
  description: '柱状图,用于对比各分类的数值大小。数据通过 dataset.source 提供,encode 指定分类轴与数值轴字段。',
  capability: chartCapability,
  template: {
    type: 'bar-chart',
    name: '柱状图',
    placement: chartPlacement,
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
              color: createThemeColorReference('text-primary'),
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
                  { offset: 0, color: createThemeColorReference('primary') },
                  { offset: 1, color: 'transparent' },
                ],
              },
            },
            emphasis: {
              itemStyle: {
                shadowColor: createThemeColorReference('primary'),
                shadowBlur: 14,
              },
            },
          },
        ],
      },
    },
  },
}

export const lineChartDescriptor: MaterialDescriptor = {
  key: 'line-chart',
  type: 'line-chart',
  name: '折线图',
  group: 'charts',
  description: '折线图,用于展示数值随时间或顺序的变化趋势。数据通过 dataset.source 提供。',
  capability: chartCapability,
  template: {
    type: 'line-chart',
    name: '折线图',
    placement: chartPlacement,
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

export const areaChartDescriptor: MaterialDescriptor = {
  key: 'area-chart',
  type: 'area-chart',
  name: '面积图',
  group: 'charts',
  description: '面积图,折线下方带渐变填充,用于强调累计量或趋势的体量感。',
  capability: chartCapability,
  template: {
    type: 'area-chart',
    name: '面积图',
    placement: chartPlacement,
    props: {
      option: {
        ...createCartesianOption('累计成交额'),
        color: [createThemeColorReference('primary')],
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
              shadowColor: createThemeColorReference('primary'),
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
                  { offset: 0, color: createThemeColorReference('primary') },
                  { offset: 1, color: 'transparent' },
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

export const pieChartDescriptor: MaterialDescriptor = {
  key: 'pie-chart',
  type: 'pie-chart',
  name: '饼图',
  group: 'charts',
  description: '环形饼图,用于展示各部分占整体的构成比例。encode 用 itemName 指定名称字段、value 指定数值字段。',
  capability: chartCapability,
  template: {
    type: 'pie-chart',
    name: '饼图',
    placement: chartPlacement,
    props: {
      option: {
        ...createChartBaseOption('流量来源构成'),
        color: [createThemeColorReference('primary'), '#22d3ee', '#fbbf24', '#34d399', '#fb7185'],
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
            color: createThemeColorReference('text-secondary'),
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
              borderColor: createThemeColorReference('page-background'),
              borderWidth: 2,
            },
            label: {
              show: false,
              position: 'outside',
              color: createThemeColorReference('text-primary'),
              fontSize: 11,
            },
            labelLine: {
              length: 10,
              length2: 8,
              lineStyle: {
                color: createThemeColorReference('border'),
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

export const chartDescriptors: MaterialDescriptor[] = [
  barChartDescriptor,
  lineChartDescriptor,
  areaChartDescriptor,
  pieChartDescriptor,
]
