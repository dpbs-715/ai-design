<script setup lang="ts">
defineOptions({ name: 'MaterialItem' })

const props = defineProps(['material'])

function onStart(e: DragEvent) {
  e.dataTransfer?.setData('schema', JSON.stringify(props.material.schema))
}
</script>

<template>
  <div class="material-item whitespace-nowrap" draggable="true" @dragstart="onStart">
    <div class="title">{{ material.name }}</div>
    <div class="icon">
      <Icon :icon="material.icon" width="80" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.material-item {
  height: 120px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-raised);
  cursor: grab;

  .title {
    height: 26px;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
  }

  .icon {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--surface-workbench);
    color: var(--text-muted);
  }

  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease;

  &:hover {
    border-color: rgb(123 140 255 / 48%);
    background: var(--surface-hover);

    .title,
    .icon {
      color: var(--text-primary);
    }
  }

  &:active {
    cursor: grabbing;
  }
}
</style>
