<script setup lang="ts">
import MaterialItem from '@/editor/panels/material/components/MaterialItem.vue'
import ProjectModuleItem from '@/editor/panels/material/components/ProjectModuleItem.vue'
import { getMaterialByGroup, geyMaterialGroups } from '@/materials'
import { useWorkspaceStore } from '@/workspace/store.ts'
import { useRoute } from 'vue-router'

defineOptions({ name: 'MaterialPanel' })

const activeGroup = ref('charts')
const route = useRoute()
const workspaceStore = useWorkspaceStore()

const projectId = computed(() => String(route.params.projectId ?? ''))
const projectModules = computed(() =>
  projectId.value ? workspaceStore.getProjectModules(projectId.value) : [],
)
const groups = computed(() => {
  const materialGroups = geyMaterialGroups()
  if (route.name !== 'ProjectPageEditor') return materialGroups
  return [
    {
      name: '项目模块',
      icon: 'fluent:puzzle-piece-20-filled',
      key: 'project-modules',
    },
    ...materialGroups,
  ]
})

const currentMaterial = computed(() => {
  return activeGroup.value === 'project-modules' ? [] : getMaterialByGroup(activeGroup.value)
})

const activeGroupName = computed(() => {
  return groups.value.find((group) => group.key === activeGroup.value)?.name ?? ''
})

watch(
  () => route.name,
  (routeName) => {
    if (routeName === 'ProjectPageEditor') activeGroup.value = 'project-modules'
  },
  { immediate: true },
)
</script>

<template>
  <div class="material-panel">
    <div class="panel-heading">
      <span class="panel-title">素材</span>
      <span class="panel-context">{{ activeGroupName }}</span>
    </div>

    <div class="panel-body">
      <nav class="rail-nav whitespace-nowrap" aria-label="素材分类">
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
        <template v-if="activeGroup === 'project-modules'">
          <ProjectModuleItem
            v-for="publicModule in projectModules"
            :key="publicModule.id"
            :public-module="publicModule"
          />
          <div v-if="!projectModules.length" class="project-modules-empty">
            <Icon icon="fluent:puzzle-piece-20-regular" width="24" />
            <strong>暂无公共模块</strong>
            <span>先在项目工作台创建模块，再拖入页面。</span>
          </div>
        </template>
        <MaterialItem v-else v-for="material in currentMaterial" :key="material.name" :material />
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

.project-modules-empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--text-muted);
  text-align: center;

  strong {
    margin-top: 10px;
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
  }

  span {
    max-width: 130px;
    margin-top: 5px;
    font-size: 9px;
    line-height: 1.6;
  }
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

  .material-list {
    min-width: 0;
    flex: 1;
    padding: 4px 10px 10px;
    background: var(--surface-panel);
  }
}
</style>
