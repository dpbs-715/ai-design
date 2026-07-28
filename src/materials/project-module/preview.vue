<template>
  <div class="project-module-preview">
    <span class="preview-title"></span>
    <div>
      <i v-for="index in 3" :key="index">
        <b></b>
        <small></small>
      </i>
    </div>
  </div>
</template>

<style scoped lang="scss">
.project-module-preview {
  width: 86%;
  padding: 8px;
  border: 1px dashed color-mix(in srgb, var(--accent-color) 50%, var(--border-color));
  border-radius: 5px;
  background: var(--accent-soft);
}

.preview-title {
  display: block;
  width: 32%;
  height: 3px;
  border-radius: 99px;
  background: var(--accent-color);
}

.project-module-preview > div {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-top: 8px;
}

.project-module-preview i {
  display: flex;
  height: 20px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background: var(--surface-panel);
}

.project-module-preview b {
  width: 36%;
  height: 3px;
  background: var(--text-secondary);
}

.project-module-preview small {
  width: 54%;
  height: 2px;
  background: var(--border-color-strong);
}
</style>
