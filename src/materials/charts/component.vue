<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import { init, type EChartsType } from 'echarts'
import { useRefResizeObserver } from '@/hooks/useRefResizeObserver.ts'
import { useDataSource } from '@/hooks/useDataSource.ts'

defineOptions({
  name: 'ChartMaterial',
})

let chart: EChartsType
const props = defineProps<{ schema: MaterialSchema }>()
const chartRef = useTemplateRef('chartRef')

const dataId = computed(() => props.schema.dataId)

const { data } = useDataSource(dataId)

const option = computed(() => {
  const _option = props.schema.props.option

  return {
    ..._option,
    dataset: {
      ..._option.dataset,
      source: data.value || _option.dataset.source,
    },
  }
})

let resize = () => {}
useRefResizeObserver(chartRef, {
  exec: () => resize(),
  timer: 0,
})

watch(option, (newValue) => chart.setOption(newValue), {
  deep: true,
})

onMounted(() => {
  chart = init(chartRef.value)
  chart.setOption(option.value)
  resize = chart.resize
})
</script>

<template>
  <div class="chart-material w-full h-full" ref="chartRef" />
</template>

<style scoped lang="scss"></style>
