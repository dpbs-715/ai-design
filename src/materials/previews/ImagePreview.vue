<script setup lang="ts">
defineOptions({ name: 'ImageMaterialPreview' })
</script>

<template>
  <div class="image-preview" aria-hidden="true">
    <svg viewBox="0 0 160 56">
      <defs>
        <linearGradient id="image-preview-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="sky-start" />
          <stop offset="1" class="sky-end" />
        </linearGradient>
      </defs>
      <rect class="frame" x="30" y="8" width="100" height="40" rx="6" />
      <rect class="sky" x="33" y="11" width="94" height="34" rx="4" />
      <circle class="sun" cx="112" cy="21" r="5" />
      <path class="hill hill-far" d="M33 40 L60 24 L86 36 L106 26 L127 38 L127 45 L33 45 Z" />
      <path class="hill hill-near" d="M33 45 L70 32 L98 42 L127 35 L127 45 Z" />
    </svg>
    <span class="preview-copy">
      <strong>图片展示</strong>
      <small>填充、圆角与透明度</small>
    </span>
  </div>
</template>

<style scoped lang="scss">
.image-preview {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);

  svg {
    display: block;
    width: 72px;
    height: 100%;
    flex: none;
  }
}

.frame {
  fill: none;
  stroke: color-mix(in srgb, var(--accent-color) 48%, var(--border-color));
  stroke-width: 1;
}

.sky {
  fill: url('#image-preview-sky');
}

.sky-start {
  stop-color: var(--accent-color);
  stop-opacity: 0.35;
}

.sky-end {
  stop-color: var(--accent-color);
  stop-opacity: 0.08;
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

.preview-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.04em;
  }

  small {
    color: var(--text-muted);
    font-size: 9px;
    letter-spacing: 0.06em;
  }
}
</style>
