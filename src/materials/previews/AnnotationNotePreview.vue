<script setup lang="ts">
defineOptions({ name: 'AnnotationNoteMaterialPreview' })
</script>

<template>
  <svg class="note-preview" viewBox="0 0 160 56" aria-hidden="true">
    <rect class="note-card" x="22" y="7" width="116" height="42" rx="4" />
    <rect class="note-accent" x="22" y="7" width="4" height="42" rx="2" />
    <rect class="note-title" x="34" y="15" width="42" height="6" rx="3" />
    <rect class="note-line" x="34" y="28" width="88" height="4" rx="2" />
    <rect class="note-line" x="34" y="36" width="72" height="4" rx="2" />
  </svg>
</template>

<style scoped lang="scss">
.note-preview {
  display: block;
  width: 100%;
  height: 100%;
}

.note-card {
  fill: var(--surface-raised);
  stroke: var(--border-color);
}

.note-accent {
  fill: var(--accent-color);
}

.note-title {
  fill: var(--accent-color);
}

.note-line {
  fill: var(--text-muted);
  opacity: 0.55;
}
</style>
