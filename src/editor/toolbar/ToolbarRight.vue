<script setup lang="ts">
defineOptions({ name: 'ToolbarRight' })
</script>

<template>
  <div class="flex gap-20 toolbar-right justify-end">
    <span>
      <Icon icon="fluent:preview-link-16-filled" />
    </span>
    <span>
      <Icon icon="si:json-duotone" />
    </span>
    <span>
      <Icon icon="entypo:publish" />
    </span>
    <span>
      <Icon icon="mdi:import" />
    </span>
    <span>
      <Icon icon="mdi:export" />
    </span>
  </div>
</template>

<style scoped lang="scss">
.toolbar-right {
  span {
    padding: 4px;
    border: 1px solid #3b465b;
    border-radius: 3px;
    cursor: pointer;
  }
}
</style>
