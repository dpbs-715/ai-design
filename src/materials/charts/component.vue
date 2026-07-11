<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import { init, type EChartsType } from 'echarts'
import { useRefResizeObserver } from '@/hooks/useRefResizeObserver.ts'
defineOptions({
  name: 'ChartMaterial',
})
let chart: EChartsType
const props = defineProps<{ schema: MaterialSchema }>()
const chartRef = useTemplateRef('chart')
let resize = () => {}

useRefResizeObserver(chartRef, {
  exec: () => resize(),
  timer: 0,
})

watch(
  () => props.schema.props.option,
  () => chart.setOption(props.schema.props.option),
  {
    deep: true,
  },
)

onMounted(() => {
  chart = init(chartRef.value)
  chart.setOption(props.schema.props.option)
  resize = chart.resize
})
</script>

<template>
  <div class="chart-material w-full h-full" ref="chart" />
</template>

<style scoped lang="scss"></style>
