<script setup lang="ts">
defineOptions({ name: 'ChartMaterialPreview' })

defineProps<{
  variant: 'bar' | 'line' | 'area' | 'pie'
}>()
</script>

<template>
  <svg class="chart-preview" viewBox="0 0 160 56" aria-hidden="true">
    <template v-if="variant === 'bar'">
      <line class="guide" x1="20" y1="48" x2="140" y2="48" />
      <rect class="bar bar-muted" x="27" y="29" width="12" height="19" rx="2" />
      <rect class="bar" x="49" y="19" width="12" height="29" rx="2" />
      <rect class="bar bar-muted" x="71" y="25" width="12" height="23" rx="2" />
      <rect class="bar" x="93" y="10" width="12" height="38" rx="2" />
      <rect class="bar bar-soft" x="115" y="16" width="12" height="32" rx="2" />
    </template>

    <template v-else-if="variant === 'line'">
      <line class="guide" x1="20" y1="18" x2="140" y2="18" />
      <line class="guide" x1="20" y1="34" x2="140" y2="34" />
      <path class="series-line" d="M20 41L43 30L66 34L89 18L112 24L140 11" />
      <circle class="series-point" cx="20" cy="41" r="2" />
      <circle class="series-point" cx="43" cy="30" r="2" />
      <circle class="series-point" cx="66" cy="34" r="2" />
      <circle class="series-point" cx="89" cy="18" r="2" />
      <circle class="series-point" cx="112" cy="24" r="2" />
      <circle class="series-point" cx="140" cy="11" r="2" />
    </template>

    <template v-else-if="variant === 'area'">
      <line class="guide" x1="20" y1="18" x2="140" y2="18" />
      <line class="guide" x1="20" y1="34" x2="140" y2="34" />
      <path class="area-fill" d="M20 41L43 30L66 34L89 18L112 24L140 11V48H20Z" />
      <path class="series-line" d="M20 41L43 30L66 34L89 18L112 24L140 11" />
    </template>

    <template v-else>
      <path class="pie-segment pie-primary" d="M80 28V8A20 20 0 0 1 98 37Z" />
      <path class="pie-segment pie-secondary" d="M80 28L98 37A20 20 0 0 1 67 43Z" />
      <path class="pie-segment pie-muted" d="M80 28L67 43A20 20 0 0 1 80 8Z" />
    </template>
  </svg>
</template>

<style scoped lang="scss">
.chart-preview {
  display: block;
  width: 100%;
  height: 100%;
}

.guide {
  stroke: var(--border-color);
  stroke-width: 1;
}

.bar {
  fill: var(--accent-color);
}

.bar-muted {
  opacity: 0.58;
}

.bar-soft {
  opacity: 0.78;
}

.series-line {
  fill: none;
  stroke: var(--accent-color);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.series-point {
  fill: var(--surface-workbench);
  stroke: var(--accent-color);
  stroke-width: 1.5;
}

.area-fill {
  fill: var(--accent-soft-hover);
}

.pie-segment {
  stroke: var(--surface-workbench);
  stroke-width: 1.5;
}

.pie-primary {
  fill: var(--accent-color);
}

.pie-secondary {
  fill: color-mix(in srgb, var(--accent-color) 68%, var(--surface-workbench));
}

.pie-muted {
  fill: color-mix(in srgb, var(--accent-color) 38%, var(--surface-workbench));
}
</style>
