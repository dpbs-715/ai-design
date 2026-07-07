<script setup lang="ts">
defineOptions({ name: 'MaterialItem' })
defineProps(['material'])
</script>

<template>
  <div class="material-item whitespace-nowrap">
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
  border-radius: 4px;
  background: bg-mix(40);
  .title {
    height: 26px;
    font-size: 12px;
    font-weight: 700;
  }
  .icon {
    flex: 1;
    display: flex;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: 4px;
  }
  transition: transform 0.3s ease-in-out;
  &:hover {
    transform: translateY(-2px);
    --border-color: #5e8382;
  }
}
</style>
