<script setup lang="ts">
defineOptions({ name: 'LayerPanel' })
</script>

<template>
  <div class="h-full">
    <div class="h-full layer-panel overflow-auto whitespace-nowrap">
      <div v-for="i in 40" :key="i">
        <span>柱状图</span>
        <span>
          <Icon icon="fluent:list-bar-24-filled" />
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layer-panel {
  padding: 10px;
  background: bg-mix(50);
  & > div {
    margin-bottom: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    height: 20px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: bg-mix(70);
    font-size: 12px;
    &.active {
      background: #0b99b6;
    }
  }
}
</style>
