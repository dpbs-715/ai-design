<script setup lang="ts">
defineOptions({ name: 'DialogMaterialPreview' })
</script>

<template>
  <div class="dialog-preview">
    <header>
      <span />
      <i />
    </header>
    <main>
      <b />
      <b />
      <b />
    </main>
  </div>
</template>

<style scoped>
.dialog-preview {
  width: 96px;
  overflow: hidden;
  border: 1px solid var(--border-color-strong);
  border-radius: 6px;
  background: var(--surface-raised);
  box-shadow: 0 6px 14px color-mix(in srgb, #000 12%, transparent);
}

.dialog-preview header {
  display: flex;
  height: 15px;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-preview header span {
  width: 30px;
  height: 3px;
  border-radius: 99px;
  background: var(--text-secondary);
}

.dialog-preview header i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-muted);
}

.dialog-preview main {
  display: grid;
  height: 35px;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  padding: 6px;
}

.dialog-preview main b {
  border-radius: 2px;
  background: color-mix(in srgb, var(--accent-color) 22%, transparent);
}

.dialog-preview main b:first-child {
  grid-column: 1 / 3;
}
</style>
