<script setup lang="ts">
defineOptions({ name: 'TextMaterialPreview' })
</script>

<template>
  <svg class="text-preview" viewBox="0 0 160 56" aria-hidden="true">
    <text class="type-glyph" x="10" y="40">Aa</text>
    <rect class="title-bar" x="65" y="14" width="66" height="7" rx="3.5" />
    <rect class="text-line" x="65" y="27" width="78" height="4" rx="2" />
    <rect class="text-line" x="65" y="35" width="70" height="4" rx="2" />
    <rect class="text-line text-line-short" x="65" y="43" width="42" height="4" rx="2" />
  </svg>
</template>

<style scoped lang="scss">
.text-preview {
  display: block;
  width: 100%;
  height: 100%;
}

.type-glyph {
  fill: var(--accent-color);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.04em;
}

.title-bar {
  fill: var(--text-primary);
  opacity: 0.85;
}

.text-line {
  fill: var(--text-muted);
  opacity: 0.55;
}

.text-line-short {
  opacity: 0.35;
}
</style>
