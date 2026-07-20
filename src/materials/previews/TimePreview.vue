<script setup lang="ts">
defineOptions({ name: 'TimeMaterialPreview' })
</script>

<template>
  <svg class="time-preview" viewBox="0 0 160 56" aria-hidden="true">
    <defs>
      <linearGradient id="time-preview-tile" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="tile-stop tile-stop-start" />
        <stop offset="1" class="tile-stop tile-stop-end" />
      </linearGradient>
    </defs>

    <rect class="tile" x="22" y="14" width="32" height="28" rx="6" />
    <rect class="tile" x="64" y="14" width="32" height="28" rx="6" />
    <rect class="tile tile-soft" x="106" y="14" width="32" height="28" rx="6" />

    <line class="tile-split" x1="24" y1="28" x2="52" y2="28" />
    <line class="tile-split" x1="66" y1="28" x2="94" y2="28" />
    <line class="tile-split" x1="108" y1="28" x2="136" y2="28" />

    <text class="tile-digits" x="38" y="33.5" text-anchor="middle">12</text>
    <text class="tile-digits" x="80" y="33.5" text-anchor="middle">34</text>
    <text class="tile-digits" x="122" y="33.5" text-anchor="middle">56</text>

    <circle class="colon-dot" cx="59" cy="23.5" r="1.7" />
    <circle class="colon-dot" cx="59" cy="32.5" r="1.7" />
    <circle class="colon-dot" cx="101" cy="23.5" r="1.7" />
    <circle class="colon-dot" cx="101" cy="32.5" r="1.7" />
  </svg>
</template>

<style scoped lang="scss">
.time-preview {
  display: block;
  width: 100%;
  height: 100%;
}

.tile {
  fill: url('#time-preview-tile');
}

.tile-soft {
  fill: color-mix(in srgb, var(--accent-color) 68%, var(--surface-workbench));
}

.tile-stop-start {
  stop-color: var(--accent-color);
}

.tile-stop-end {
  stop-color: color-mix(in srgb, var(--accent-color) 68%, var(--surface-workbench));
}

.tile-split {
  stroke: var(--surface-workbench);
  stroke-width: 1;
  opacity: 0.35;
}

.tile-digits {
  fill: var(--surface-workbench);
  font-family: 'DIN Alternate', 'Arial Narrow', monospace;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.colon-dot {
  fill: var(--accent-color);
  opacity: 0.85;
}

</style>
