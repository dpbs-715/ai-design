<script setup lang="ts">
defineOptions({ name: 'ImageMaterialPreview' })
</script>

<template>
  <svg class="image-preview" viewBox="0 0 160 56" aria-hidden="true">
    <defs>
      <linearGradient id="image-preview-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="sky-stop sky-stop-start" />
        <stop offset="1" class="sky-stop sky-stop-end" />
      </linearGradient>
      <clipPath id="image-preview-clip">
        <rect x="20" y="8" width="120" height="40" rx="5" />
      </clipPath>
    </defs>

    <rect class="frame" x="20" y="8" width="120" height="40" rx="5" />
    <g clip-path="url('#image-preview-clip')">
      <rect class="sky" x="20" y="8" width="120" height="40" />
      <circle class="sun" cx="116" cy="18" r="4.5" />
      <path class="hill hill-far" d="M20 42 L48 26 L74 35 L96 25 L118 33 L140 27 L140 48 L20 48 Z" />
      <path class="hill hill-near" d="M20 48 L52 34 L86 43 L114 36 L140 42 L140 48 Z" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
.image-preview {
  display: block;
  width: 100%;
  height: 100%;
}

.frame {
  fill: none;
  stroke: color-mix(in srgb, var(--accent-color) 48%, var(--border-color));
  stroke-width: 1;
}

.sky {
  fill: url('#image-preview-sky');
}

.sky-stop-start {
  stop-color: var(--accent-color);
  stop-opacity: 0.3;
}

.sky-stop-end {
  stop-color: var(--accent-color);
  stop-opacity: 0.06;
}

.sun {
  fill: var(--accent-color);
  opacity: 0.8;
}

.hill-far {
  fill: color-mix(in srgb, var(--accent-color) 45%, var(--surface-workbench));
  opacity: 0.75;
}

.hill-near {
  fill: color-mix(in srgb, var(--accent-color) 70%, var(--surface-workbench));
}
</style>
