<script setup lang="ts">
import MaterialItem from '@/editor/panels/material/components/MaterialItem.vue'
import { getMaterialByGroup, geyMaterialGroups } from '@/materials'

defineOptions({ name: 'MaterialPanel' })

const activeGroup = ref('charts')
const groups = geyMaterialGroups()

const currentMaterial = computed(() => {
  return getMaterialByGroup(activeGroup.value)
})

const activeGroupName = computed(() => {
  return groups.find((group) => group.key === activeGroup.value)?.name ?? ''
})
</script>

<template>
  <div class="material-panel">
    <div class="panel-heading">
      <span class="panel-title">素材</span>
      <span class="panel-context">{{ activeGroupName }}</span>
    </div>

    <div class="panel-body">
      <nav class="nav whitespace-nowrap" aria-label="素材分类">
        <button
          v-for="group in groups"
          :key="group.key"
          type="button"
          :class="{ active: activeGroup === group.key }"
          :aria-pressed="activeGroup === group.key"
          @click="activeGroup = group.key"
        >
          <Icon :icon="group.icon" width="18" />
          <span>{{ group.name }}</span>
        </button>
      </nav>

      <div class="material-list overflow-auto">
        <MaterialItem v-for="material in currentMaterial" :key="material.name" :material />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.material-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  background: var(--surface-panel);
}

.panel-heading {
  display: flex;
  height: 42px;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  color: var(--text-primary);
  font-weight: 500;
}

.panel-context {
  color: var(--text-muted);
  font-size: 12px;
}

.panel-body {
  display: flex;
  min-height: 0;
  flex: 1;

  .nav {
    width: 54px;
    flex: none;
    background: var(--surface-workbench);
    border-right: 1px solid var(--border-color);

    button {
      display: flex;
      width: 100%;
      height: 58px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 0;
      border: 0;
      background: transparent;
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
        box-shadow: inset 2px 0 0 var(--accent-color);
      }
    }
  }

  .material-list {
    min-width: 0;
    flex: 1;
    padding: 4px 10px 10px;
    background: var(--surface-panel);
  }
}
</style>
