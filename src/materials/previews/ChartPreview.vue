<script setup lang="ts">
defineOptions({ name: 'ChartMaterialPreview' })

defineProps<{
  variant: 'bar' | 'line' | 'area' | 'pie'
}>()
</script>

<template>
  <svg class="chart-preview" viewBox="0 0 160 56" aria-hidden="true">
    <defs>
      <linearGradient id="area-preview-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="area-stop area-stop-start" />
        <stop offset="1" class="area-stop area-stop-end" />
      </linearGradient>
      <linearGradient id="bar-preview-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="bar-stop bar-stop-start" />
        <stop offset="1" class="bar-stop bar-stop-end" />
      </linearGradient>
    </defs>

    <template v-if="variant === 'bar'">
      <line class="guide" x1="20" y1="48" x2="140" y2="48" />
      <rect class="bar bar-muted" x="27" y="29" width="12" height="19" rx="3" />
      <rect class="bar" x="49" y="19" width="12" height="29" rx="3" />
      <rect class="bar bar-muted" x="71" y="25" width="12" height="23" rx="3" />
      <rect class="bar" x="93" y="10" width="12" height="38" rx="3" />
      <rect class="bar bar-soft" x="115" y="16" width="12" height="32" rx="3" />
    </template>

    <template v-else-if="variant === 'line'">
      <line class="guide guide-dashed" x1="20" y1="18" x2="140" y2="18" />
      <line class="guide guide-dashed" x1="20" y1="36" x2="140" y2="36" />
      <path class="series-line line-shadow" d="M20 42L40 29L60 35L80 17L100 25L120 10L140 20" />
      <path class="series-line" d="M20 42L40 29L60 35L80 17L100 25L120 10L140 20" />
      <circle class="series-point" cx="20" cy="42" r="2.5" />
      <circle class="series-point" cx="40" cy="29" r="2.5" />
      <circle class="series-point" cx="60" cy="35" r="2.5" />
      <circle class="series-point" cx="80" cy="17" r="2.5" />
      <circle class="series-point" cx="100" cy="25" r="2.5" />
      <circle class="peak-ring" cx="120" cy="10" r="5" />
      <circle class="series-point" cx="120" cy="10" r="2.5" />
      <circle class="series-point" cx="140" cy="20" r="2.5" />
    </template>

    <template v-else-if="variant === 'area'">
      <line class="guide guide-dashed" x1="20" y1="18" x2="140" y2="18" />
      <line class="guide guide-dashed" x1="20" y1="36" x2="140" y2="36" />
      <path
        class="area-fill"
        d="M20 43C33 42 38 35 50 34C64 33 68 26 80 25C94 24 99 18 110 16C122 14 130 10 140 8V48H20Z"
      />
      <path
        class="area-line"
        d="M20 43C33 42 38 35 50 34C64 33 68 26 80 25C94 24 99 18 110 16C122 14 130 10 140 8"
      />
    </template>

    <template v-else>
      <path class="pie-segment pie-primary" d="M80 28V8A20 20 0 0 1 98 37Z" />
      <path class="pie-segment pie-secondary" d="M80 28L98 37A20 20 0 0 1 67 43Z" />
      <path class="pie-segment pie-muted" d="M80 28L67 43A20 20 0 0 1 80 8Z" />
      <circle class="donut-hole" cx="80" cy="28" r="10" />
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

.guide-dashed {
  stroke-dasharray: 3 4;
}

.bar {
  fill: url('#bar-preview-gradient');
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
  stroke-width: 2.5;
}

.line-shadow {
  opacity: 0.22;
  stroke-width: 7;
}

.series-point {
  fill: var(--surface-workbench);
  stroke: var(--accent-color);
  stroke-width: 2;
}

.peak-ring {
  fill: var(--accent-soft-hover);
  stroke: var(--accent-color);
  stroke-width: 1;
}

.area-fill {
  fill: url('#area-preview-gradient');
}

.area-line {
  fill: none;
  stroke: var(--accent-color);
  stroke-linecap: round;
  stroke-width: 2;
}

.area-stop-start,
.bar-stop-start {
  stop-color: var(--accent-color);
}

.area-stop-start {
  stop-opacity: 0.52;
}

.area-stop-end {
  stop-color: var(--accent-color);
  stop-opacity: 0.02;
}

.bar-stop-end {
  stop-color: color-mix(in srgb, var(--accent-color) 68%, var(--surface-workbench));
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

.donut-hole {
  fill: var(--surface-workbench);
  stroke: var(--surface-workbench);
  stroke-width: 2;
}
</style>
