<script setup lang="ts">
import MaterialItem from '@/editor/panels/material/components/MaterialItem.vue'
import { getMaterialByGroup, geyMaterialGroups } from '@/materials'

defineOptions({ name: 'MaterialPanel' })

const activeGroup = ref('info')
const groups = geyMaterialGroups()

const currentMaterial = computed(() => {
  return getMaterialByGroup(activeGroup.value)
})
</script>

<template>
  <div class="material-panel flex">
    <div class="nav w-50 whitespace-nowrap">
      <div
        @click="activeGroup = item.key"
        :class="{ active: activeGroup === item.key }"
        v-for="item in groups"
        :key="item.key"
      >
        <span>
          <Icon :icon="item.icon" width="16" />
        </span>
        <span>{{ item.name }}</span>
      </div>
    </div>
    <div class="material-list flex-1 p-10 overflow-auto">
      <MaterialItem
        class="mb-10"
        v-for="item in currentMaterial"
        :key="item.name"
        :material="item"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.material-panel {
  background: bg-mix(20);
  .nav {
    border-right: 1px solid var(--border-color);
    div {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 50px;
      font-size: 12px;
      cursor: pointer;

      &.active {
        background: bg-mix(70);
      }
    }
  }
}
</style>
