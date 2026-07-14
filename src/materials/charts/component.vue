<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import { init, type EChartsType } from 'echarts'
import { useRefResizeObserver } from '@/hooks/useRefResizeObserver.ts'
import { useDataSource } from '@/hooks/useDataSource.ts'
import {
  applyChartTheme,
  useChartThemeAccentColor,
  usesChartTheme,
} from '@/materials/charts/theme.ts'

defineOptions({
  name: 'ChartMaterial',
})

let chart: EChartsType | undefined
const props = defineProps<{ schema: MaterialSchema }>()
const chartRef = useTemplateRef('chartRef')
const themeAccentColor = useChartThemeAccentColor()

const dataId = computed(() => props.schema.dataId)

const { data, loading, refresh } = useDataSource(dataId)

const option = computed(() => {
  const _option = props.schema.props.option
  const optionWithData = {
    ..._option,
    dataset: {
      ..._option.dataset,
      source: data.value || _option.dataset.source,
    },
  }

  return usesChartTheme(props.schema.props.colorMode)
    ? applyChartTheme(props.schema.type, optionWithData, themeAccentColor.value)
    : optionWithData
})

let resize = () => {}
useRefResizeObserver(chartRef, {
  exec: () => resize(),
  timer: 0,
})

watch(option, (newValue) => chart?.setOption(newValue), {
  deep: true,
})

defineExpose({ refresh })

onMounted(() => {
  chart = init(chartRef.value)
  chart.setOption(option.value)
  resize = () => chart?.resize()
})

onBeforeUnmount(() => {
  chart?.dispose()
  chart = undefined
})
</script>

<template>
  <div v-loading="loading" class="chart-material w-full h-full">
    <div class="w-full h-full" ref="chartRef" />
  </div>
</template>

<style scoped lang="scss"></style>
