<script setup lang="ts">
defineOptions({ name: 'ButtonMaterialPreview' })
</script>

<template>
  <div class="button-preview">
    <span>按钮</span>
    <Icon icon="fluent:cursor-click-20-regular" width="14" />
  </div>
</template>

<style scoped>
.button-preview {
  display: flex;
  width: 96px;
  height: 34px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid color-mix(in srgb, var(--accent-color) 74%, var(--border-color));
  border-radius: 5px;
  background: var(--accent-soft);
  color: var(--accent-color);
  font-size: 12px;
  font-weight: 600;
}
</style>
