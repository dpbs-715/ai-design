<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import { init } from 'echarts'
defineOptions({
  name: 'ChartMaterial',
})
const props = defineProps<{ schema: MaterialSchema }>()
const chartRef = useTemplateRef('chart')

onMounted(() => {
  const chart = init(chartRef.value)
  console.log(chart)
  nextTick(() => {
    chart.setOption(props.schema.props.option)
  })
})
</script>

<template>
  <div class="chart-material w-full h-full" ref="chart" />
</template>

<style scoped lang="scss"></style>
