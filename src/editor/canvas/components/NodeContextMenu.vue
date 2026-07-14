<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import { nodeContextMenuCommands } from '@/editor/canvas/contextMenu.ts'

defineOptions({ name: 'NodeContextMenu' })

const { node } = defineProps<{
  node: MaterialSchema
}>()

const nodeIcon = computed(() =>
  node.type === 'text' ? 'fluent:text-font-20-filled' : 'fluent:data-bar-vertical-20-filled',
)
const nodeKind = computed(() => (node.type === 'text' ? '文本节点' : '图表节点'))
</script>

<template>
  <el-dropdown-menu class="node-context-menu">
    <li class="node-context-menu__header" role="presentation">
      <span class="node-context-menu__node-icon">
        <Icon :icon="nodeIcon" width="17" />
      </span>
      <span class="node-context-menu__identity">
        <strong>{{ node.name }}</strong>
        <small>{{ nodeKind }}</small>
      </span>
      <span class="node-context-menu__state" :class="{ 'is-locked': node.locked }">
        {{ node.locked ? '已锁定' : '已选中' }}
      </span>
    </li>

    <el-dropdown-item
      class="node-context-menu__layer-action node-context-menu__layer-action--first"
      :command="nodeContextMenuCommands.moveTop"
    >
      <Icon icon="mdi:arrange-bring-to-front" width="17" />
      <span>置顶</span>
    </el-dropdown-item>
    <el-dropdown-item
      class="node-context-menu__layer-action node-context-menu__layer-action--last"
      :command="nodeContextMenuCommands.moveBottom"
    >
      <Icon icon="mdi:arrange-send-to-back" width="17" />
      <span>置底</span>
    </el-dropdown-item>

    <el-dropdown-item class="node-context-menu__item" :command="nodeContextMenuCommands.copy">
      <Icon icon="fluent:copy-20-regular" width="16" />
      <span>复制节点</span>
    </el-dropdown-item>
    <el-dropdown-item class="node-context-menu__item" :command="nodeContextMenuCommands.toggleLock">
      <Icon
        :icon="node.locked ? 'fluent:lock-open-20-regular' : 'fluent:lock-closed-20-regular'"
        width="16"
      />
      <span>{{ node.locked ? '解锁节点' : '锁定节点' }}</span>
      <span class="node-context-menu__status-dot" :class="{ 'is-active': node.locked }"></span>
    </el-dropdown-item>

    <li class="node-context-menu__separator" role="separator"></li>

    <el-dropdown-item
      class="node-context-menu__item node-context-menu__item--danger"
      :command="nodeContextMenuCommands.remove"
    >
      <Icon icon="fluent:delete-20-regular" width="16" />
      <span>删除节点</span>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<style lang="scss">
.node-context-menu-popper.el-popper {
  --node-context-menu-width: 220px;

  min-width: var(--node-context-menu-width);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border-color) 88%, var(--text-muted));
  border-radius: 11px;
  background: color-mix(in srgb, var(--surface-raised) 96%, transparent);
  box-shadow:
    0 18px 42px rgb(0 0 0 / 44%),
    inset 0 1px 0 rgb(255 255 255 / 4%);
  backdrop-filter: blur(14px);
}

.node-context-menu.el-dropdown-menu {
  display: grid;
  width: var(--node-context-menu-width);
  grid-template-columns: 1fr 1fr;
  padding: 0 0 6px;
  background: transparent;

  .node-context-menu__header {
    display: grid;
    min-width: 0;
    grid-column: 1 / -1;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    padding: 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--border-color) 72%, transparent);
    list-style: none;
  }

  .node-context-menu__node-icon {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent-color);
  }

  .node-context-menu__identity {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;

    strong,
    small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
      line-height: 1.1;
    }

    small {
      color: var(--text-muted);
      font-size: 11px;
      line-height: 1.1;
    }
  }

  .node-context-menu__state {
    padding: 3px 6px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    color: var(--text-muted);
    font-size: 10px;
    line-height: 1;
    white-space: nowrap;

    &.is-locked {
      border-color: color-mix(in srgb, var(--accent-color) 40%, var(--border-color));
      background: var(--accent-soft);
      color: var(--accent-color-hover);
    }
  }

  .node-context-menu__layer-action.el-dropdown-menu__item {
    height: 48px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 7px;
    background: color-mix(in srgb, var(--surface-workbench) 76%, transparent);
    color: var(--text-secondary);
    font-size: 11px;
    line-height: 1;

    &:hover,
    &:focus {
      border-color: color-mix(in srgb, var(--accent-color) 38%, var(--border-color));
      background: var(--accent-soft);
      color: var(--accent-color-hover);
    }

    > .iconify {
      margin: 0;
    }
  }

  .node-context-menu__layer-action--first {
    margin: 10px 4px 7px 10px;
  }

  .node-context-menu__layer-action--last {
    margin: 10px 10px 7px 4px;
  }

  .node-context-menu__item.el-dropdown-menu__item {
    display: grid;
    height: 36px;
    grid-column: 1 / -1;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    gap: 8px;
    margin: 0 6px;
    padding: 0 9px;
    border-radius: 6px;
    color: var(--text-secondary);
    line-height: 1;

    &:hover,
    &:focus {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    > .iconify {
      margin: 0;
      color: var(--text-muted);
    }

    &:hover > .iconify,
    &:focus > .iconify {
      color: var(--accent-color-hover);
    }
  }

  .node-context-menu__status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-muted);
    opacity: 0.42;

    &.is-active {
      background: var(--accent-color);
      box-shadow: 0 0 0 3px var(--accent-soft);
      opacity: 1;
    }
  }

  .node-context-menu__separator {
    height: 1px;
    grid-column: 1 / -1;
    margin: 6px 0 5px;
    background: color-mix(in srgb, var(--border-color) 72%, transparent);
    list-style: none;
  }

  .node-context-menu__item--danger.el-dropdown-menu__item {
    color: color-mix(in srgb, var(--el-color-danger) 82%, var(--text-primary));

    > .iconify {
      color: var(--el-color-danger);
    }

    &:hover,
    &:focus {
      background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
      color: var(--el-color-danger);

      > .iconify {
        color: var(--el-color-danger);
      }
    }
  }
}

@media (prefers-reduced-motion: no-preference) {
  .node-context-menu.el-dropdown-menu .el-dropdown-menu__item {
    transition:
      color 120ms ease,
      background-color 120ms ease,
      border-color 120ms ease;
  }
}
</style>
