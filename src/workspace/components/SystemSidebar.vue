<script setup lang="ts">
import type { BusinessSystem } from '../types.ts'

defineOptions({ name: 'SystemSidebar' })

const collapsed = defineModel<boolean>('collapsed', { required: true })
const selectedSystemId = defineModel<string>('selectedSystemId', { required: true })

const props = defineProps<{
  systems: BusinessSystem[]
  drawer?: boolean
  open?: boolean
}>()

const emit = defineEmits<{
  close: []
  create: []
  rename: [system: BusinessSystem]
  remove: [system: BusinessSystem]
}>()

type SystemAction = 'rename' | 'remove'

function selectSystem(systemId: string) {
  selectedSystemId.value = systemId
  if (props.drawer) emit('close')
}

function runSystemAction(action: SystemAction, system: BusinessSystem) {
  if (action === 'rename') emit('rename', system)
  else emit('remove', system)
}
</script>

<template>
  <aside
    class="system-sidebar"
    :class="{ 'is-collapsed': collapsed, 'is-drawer': drawer, 'is-open': open }"
  >
    <div class="sidebar-heading">
      <div class="sidebar-heading-copy" :aria-hidden="collapsed">
        <span>业务系统</span>
        <small>SYSTEMS</small>
      </div>
      <div class="sidebar-heading-actions">
        <button
          v-if="!collapsed"
          type="button"
          class="heading-action"
          aria-label="新增业务系统"
          @click="$emit('create')"
        >
          <Icon icon="fluent:add-20-regular" width="17" />
        </button>
        <button
          type="button"
          class="heading-action"
          :aria-label="drawer ? '关闭系统栏' : collapsed ? '展开系统栏' : '折叠系统栏'"
          @click="drawer ? $emit('close') : (collapsed = !collapsed)"
        >
          <Icon
            :icon="
              drawer
                ? 'fluent:dismiss-20-regular'
                : collapsed
                  ? 'fluent:panel-left-expand-20-regular'
                  : 'fluent:panel-left-contract-20-regular'
            "
            width="18"
          />
        </button>
      </div>
    </div>

    <nav class="system-list" aria-label="业务系统">
      <div
        v-for="system in systems"
        :key="system.id"
        class="system-row"
        :class="{ active: selectedSystemId === system.id }"
      >
        <button
          type="button"
          class="system-item"
          :class="{ active: selectedSystemId === system.id }"
          :aria-label="system.name"
          :aria-pressed="selectedSystemId === system.id"
          @click="selectSystem(system.id)"
        >
          <span class="system-icon">
            <Icon :icon="system.icon" width="18" />
          </span>
          <span class="system-copy" :aria-hidden="collapsed">
            <strong>{{ system.name }}</strong>
            <small>{{ system.description }}</small>
          </span>
        </button>

        <el-dropdown
          v-if="!collapsed"
          class="system-menu"
          trigger="click"
          placement="bottom-end"
          @command="runSystemAction($event, system)"
        >
          <button type="button" class="system-actions" :aria-label="`管理${system.name}`">
            <Icon icon="fluent:more-horizontal-20-regular" width="17" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename">编辑系统</el-dropdown-item>
              <el-dropdown-item command="remove" divided>删除系统</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </nav>

    <div class="sidebar-foot">
      <span class="status-dot"></span>
      <span class="sidebar-foot-copy" :aria-hidden="collapsed">本地工作区已就绪</span>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.system-sidebar {
  position: relative;
  z-index: 18;
  display: flex;
  width: 228px;
  min-height: 0;
  flex: none;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--border-color);
  background: var(--surface-panel);
  transition: width 180ms ease;

  &.is-collapsed {
    width: 68px;
  }
}

.system-sidebar.is-drawer {
  position: fixed;
  top: 68px;
  bottom: 0;
  left: 0;
  width: min(286px, calc(100vw - 52px));
  box-shadow: 18px 0 44px rgb(0 0 0 / 18%);
  transform: translateX(-102%);
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);

  &.is-open {
    transform: translateX(0);
  }
}

.sidebar-heading {
  display: flex;
  height: 78px;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 18px;
  overflow: hidden;
  transition:
    gap 180ms ease,
    padding 180ms ease;
}

.sidebar-heading-copy {
  display: flex;
  min-width: 0;
  max-width: 140px;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  opacity: 1;
  white-space: nowrap;
  transition:
    flex-basis 180ms ease,
    max-width 180ms ease,
    opacity 120ms ease;

  span {
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
  }

  small {
    margin-top: 3px;
    color: var(--text-muted);
    font-size: 8px;
    letter-spacing: 0.16em;
  }
}

.sidebar-heading-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
}

.heading-action {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }
}

.is-collapsed .sidebar-heading {
  gap: 0;
  padding: 0 19px;
}

.is-collapsed .sidebar-heading-copy {
  max-width: 0;
  flex-basis: 0;
  opacity: 0;
}

.system-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  padding: 0 10px;
  overflow-x: hidden;
  overflow-y: auto;
}

.system-row {
  position: relative;
  flex: none;
}

.system-item {
  position: relative;
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 34px 8px 10px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--text-secondary);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--surface-raised);
    color: var(--text-primary);
  }

  &.active {
    border-color: color-mix(in srgb, var(--accent-color) 16%, var(--border-color));
    background: var(--accent-soft);
    color: var(--accent-color);
  }
}

.system-menu {
  position: absolute;
  z-index: 1;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}

.system-actions {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: color-mix(in srgb, var(--surface-panel) 88%, transparent);
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background-color 140ms ease,
    color 140ms ease;

  &:hover,
  &:focus-visible {
    background: var(--surface-hover);
    color: var(--text-primary);
  }
}

.system-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border: 1px solid var(--border-color);
  border-radius: 7px;
  background: var(--surface-panel);
}

.system-copy {
  display: flex;
  min-width: 0;
  max-width: 150px;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  opacity: 1;
  white-space: nowrap;
  transition:
    flex-basis 180ms ease,
    max-width 180ms ease,
    opacity 120ms ease;

  strong {
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
  }

  small {
    margin-top: 4px;
    overflow: hidden;
    color: var(--text-muted);
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.is-collapsed .system-item {
  gap: 0;
  justify-content: center;
  padding: 8px 6px;
}

.is-collapsed .system-copy {
  max-width: 0;
  flex-basis: 0;
  opacity: 0;
}

.sidebar-foot {
  display: flex;
  height: 58px;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 0 19px;
  overflow: hidden;
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 10px;
  white-space: nowrap;
  transition:
    gap 180ms ease,
    padding 180ms ease;
}

.sidebar-foot-copy {
  max-width: 150px;
  overflow: hidden;
  opacity: 1;
  transition:
    max-width 180ms ease,
    opacity 120ms ease;
}

.is-collapsed .sidebar-foot {
  justify-content: center;
  gap: 0;
  padding: 0;
}

.is-collapsed .sidebar-foot-copy {
  max-width: 0;
  opacity: 0;
}

.status-dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: #5ca47b;
  box-shadow: 0 0 0 3px color-mix(in srgb, #5ca47b 14%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .system-sidebar,
  .sidebar-heading,
  .sidebar-heading-copy,
  .system-copy,
  .system-actions,
  .sidebar-foot,
  .sidebar-foot-copy {
    transition: none;
  }

  .system-sidebar.is-drawer {
    transition: none;
  }
}
</style>
