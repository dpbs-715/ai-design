<script setup lang="ts">
defineOptions({ name: 'TimeMaterialPreview' })
</script>

<template>
  <svg class="time-preview" viewBox="0 0 160 56" aria-hidden="true">
    <g class="digit-tile">
      <rect x="20" y="10" width="12" height="32" rx="3" />
      <text x="26" y="31">1</text>
    </g>
    <g class="digit-tile">
      <rect x="35" y="10" width="12" height="32" rx="3" />
      <text x="41" y="31">8</text>
    </g>
    <circle class="colon-dot" cx="56" cy="21" r="1.6" />
    <circle class="colon-dot" cx="56" cy="31" r="1.6" />
    <g class="digit-tile">
      <rect x="65" y="10" width="12" height="32" rx="3" />
      <text x="71" y="31">3</text>
    </g>
    <g class="digit-tile">
      <rect x="80" y="10" width="12" height="32" rx="3" />
      <text x="86" y="31">0</text>
    </g>
    <circle class="colon-dot colon-dot-muted" cx="101" cy="21" r="1.6" />
    <circle class="colon-dot colon-dot-muted" cx="101" cy="31" r="1.6" />
    <g class="digit-tile digit-tile-muted">
      <rect x="110" y="10" width="12" height="32" rx="3" />
      <text x="116" y="31">4</text>
    </g>
    <g class="digit-tile digit-tile-muted">
      <rect x="125" y="10" width="12" height="32" rx="3" />
      <text x="131" y="31">5</text>
    </g>
    <rect class="date-line" x="20" y="47" width="48" height="4" rx="2" />
    <rect class="date-line date-line-short" x="72" y="47" width="24" height="4" rx="2" />
  </svg>
</template>

<style scoped lang="scss">
.time-preview {
  display: block;
  width: 100%;
  height: 100%;
}

.digit-tile {
  rect {
    fill: var(--accent-soft);
    stroke: color-mix(in srgb, var(--accent-color) 48%, var(--border-color));
    stroke-width: 1;
  }

  text {
    fill: var(--accent-color);
    font-family: 'DIN Alternate', 'Arial Narrow', Arial, sans-serif;
    font-size: 16px;
    font-weight: 700;
    text-anchor: middle;
  }
}

.digit-tile-muted {
  rect {
    fill: var(--surface-panel);
    stroke: var(--border-color);
  }

  text {
    fill: var(--text-muted);
  }
}

.colon-dot {
  fill: var(--accent-color);
}

.colon-dot-muted {
  fill: var(--text-muted);
}

.date-line {
  fill: var(--text-muted);
  opacity: 0.45;
}

.date-line-short {
  opacity: 0.25;
}
</style>
