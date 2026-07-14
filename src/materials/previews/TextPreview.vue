<script setup lang="ts">
defineOptions({ name: 'TextMaterialPreview' })
</script>

<template>
  <div class="text-preview" aria-hidden="true">
    <span class="type-mark">Aa</span>
    <span class="divider"></span>
    <span class="sample-copy">标题文本</span>
  </div>
</template>

<style scoped lang="scss">
.text-preview {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-secondary);
}

.type-mark {
  color: var(--accent-color);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.04em;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
}

.sample-copy {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
}
</style>
