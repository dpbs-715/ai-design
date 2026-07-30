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
        <rect x="44" y="8" width="72" height="40" rx="6" />
      </clipPath>
    </defs>

    <rect class="photo-back" x="50" y="9" width="64" height="38" rx="5" transform="rotate(5 82 28)" />

    <g clip-path="url('#image-preview-clip')">
      <rect class="sky" x="44" y="8" width="72" height="40" />
      <circle class="sun-halo" cx="100" cy="20" r="7.5" />
      <circle class="sun" cx="100" cy="20" r="4.5" />
      <path
        class="hill hill-far"
        d="M44 40C54 28 64 28 74 34C84 40 96 30 116 34V48H44Z"
      />
      <path
        class="hill hill-near"
        d="M44 44C58 34 72 46 86 40C100 34 108 42 116 40V48H44Z"
      />
    </g>
    <rect class="frame" x="44" y="8" width="72" height="40" rx="6" />
  </svg>
</template>

<style scoped lang="scss">
.image-preview {
  display: block;
  width: 100%;
  height: 100%;
}

.photo-back {
  fill: color-mix(in srgb, var(--accent-color) 16%, var(--surface-workbench));
  stroke: var(--border-color);
  stroke-width: 1;
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

.sun-halo {
  fill: var(--accent-color);
  opacity: 0.22;
}

.sun {
  fill: var(--accent-color);
  opacity: 0.85;
}

.hill-far {
  fill: color-mix(in srgb, var(--accent-color) 45%, var(--surface-workbench));
  opacity: 0.75;
}

.hill-near {
  fill: color-mix(in srgb, var(--accent-color) 70%, var(--surface-workbench));
}
</style>
