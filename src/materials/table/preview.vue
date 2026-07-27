<script setup lang="ts">
defineOptions({ name: 'DataTablePreview' })
</script>

<template>
  <div class="table-preview" aria-hidden="true">
    <div class="table-preview__group">
      <span>基本信息</span>
      <span>统计</span>
    </div>
    <div class="table-preview__head">
      <span>名称</span>
      <span>数值</span>
      <span>状态</span>
    </div>
    <div v-for="index in 3" :key="index" class="table-preview__row">
      <span :style="{ width: `${66 - index * 7}%` }" />
      <span :style="{ width: `${38 + index * 8}%` }" />
      <span :style="{ width: `${44 - index * 4}%` }" />
    </div>
  </div>
</template>

<style scoped>
.table-preview {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-rows: repeat(5, 1fr);
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.table-preview__group,
.table-preview__head,
.table-preview__row {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr 0.8fr;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.table-preview__group {
  grid-template-columns: 1.15fr 1.65fr;
  background: color-mix(in srgb, var(--accent-color) 12%, transparent);
}

.table-preview__head {
  background: color-mix(in srgb, var(--accent-color) 7%, transparent);
}

.table-preview__group span,
.table-preview__head span {
  color: var(--text-muted);
  font-size: 7px;
  text-align: center;
}

.table-preview__row:last-child {
  border-bottom: 0;
}

.table-preview__row span {
  height: 3px;
  margin-inline: auto;
  border-radius: 2px;
  background: color-mix(in srgb, var(--text-muted) 40%, transparent);
}
</style>
