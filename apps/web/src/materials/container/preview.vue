<template>
  <div class="container-preview">
    <span />
    <span />
    <span />
  </div>
</template>

<style scoped>
.container-preview {
  display: grid;
  width: 82px;
  height: 38px;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 4px;
  padding: 5px;
  border: 1px dashed var(--text-muted);
  border-radius: 4px;
}

.container-preview span {
  border-radius: 2px;
  background: color-mix(in srgb, var(--accent-color) 28%, transparent);
}

.container-preview span:first-child {
  grid-row: 1 / 3;
}
</style>
