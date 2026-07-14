<script setup lang="ts">
import MaterialItem from '@/editor/panels/material/components/MaterialItem.vue'
import { getMaterialByGroup, geyMaterialGroups } from '@/materials'

defineOptions({ name: 'MaterialPanel' })

const activeGroup = ref('charts')
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
  background: var(--surface-panel);

  .nav {
    background: var(--surface-workbench);
    border-right: 1px solid var(--border-color);

    div {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 50px;
      gap: 3px;
      color: var(--text-muted);
      font-size: 12px;
      cursor: pointer;
      transition:
        background-color 140ms ease,
        color 140ms ease;

      &:hover {
        background: var(--surface-raised);
        color: var(--text-secondary);
      }

      &.active {
        background: var(--accent-soft);
        color: var(--accent-color);
      }
    }
  }

  .material-list {
    background: var(--surface-panel);
  }
}
</style>
