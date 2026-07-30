<script setup lang="ts">
import { canvasContextMenuCommands } from '@/editor/canvas/contextMenu.ts'
import { getEditorShortcutLabels } from '@/editor/shortcuts.ts'

defineOptions({ name: 'CanvasContextMenu' })
const shortcutLabels = getEditorShortcutLabels()
</script>

<template>
  <el-dropdown-menu class="node-context-menu">
    <li class="node-context-menu__header" role="presentation">
      <span class="node-context-menu__node-icon icon-tile icon-tile--lg">
        <Icon icon="fluent:design-ideas-20-filled" width="17" />
      </span>
      <span class="node-context-menu__identity">
        <strong>画布</strong>
        <small>在右键位置执行操作</small>
      </span>
    </li>

    <el-dropdown-item class="node-context-menu__item" :command="canvasContextMenuCommands.paste">
      <Icon icon="fluent:clipboard-paste-20-regular" width="16" />
      <span>粘贴 JSON 到此处</span>
      <kbd class="node-context-menu__shortcut">{{ shortcutLabels.paste }}</kbd>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>
