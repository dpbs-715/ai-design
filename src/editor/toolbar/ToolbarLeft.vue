<script setup lang="ts">
import { useEditorPanelStore } from '@/stores/editorPanel.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { storeToRefs } from 'pinia'
import EditorAccentControl from '@/editor/theme/EditorAccentControl.vue'
import EditorThemeControl from '@/editor/theme/EditorThemeControl.vue'
import { getEditorShortcutLabels } from '@/editor/shortcuts.ts'
import { useWorkspaceStore } from '@/workspace/store.ts'
import { useRoute } from 'vue-router'

defineOptions({ name: 'ToolbarLeft' })

const editorPanelStore = useEditorPanelStore()
const workspaceStore = useWorkspaceStore()
const route = useRoute()
const { panelVisible } = storeToRefs(editorPanelStore)

const { undo, redo, canUndo, canRedo } = useUndoRedo()
const shortcutLabels = getEditorShortcutLabels()
const projectId = computed(() => String(route.params.projectId ?? ''))
const project = computed(() => workspaceStore.getProject(projectId.value))
const workbenchPath = computed(() => {
  if (route.name === 'ProjectPageEditor') return `/projects/${projectId.value}/pages`
  if (route.name === 'ProjectModuleEditor') return `/projects/${projectId.value}/modules`
  return ''
})
</script>

<template>
  <div class="toolbar flex items-center">
    <RouterLink
      v-if="workbenchPath"
      class="toolbar-button toolbar-back"
      :to="workbenchPath"
      :aria-label="`返回${project?.name ?? '项目'}工作台`"
    >
      <Icon icon="fluent:arrow-left-20-regular" width="17" />
    </RouterLink>
    <el-divider v-if="workbenchPath" direction="vertical" />

    <EditorThemeControl />
    <EditorAccentControl />
    <el-divider direction="vertical" />

    <button
      type="button"
      class="toolbar-button"
      :class="{ active: panelVisible.material }"
      title="切换素材面板"
      aria-label="切换素材面板"
      @click="editorPanelStore.togglePanel('material')"
    >
      <Icon icon="fluent:panel-left-28-filled" />
    </button>
    <button
      type="button"
      class="toolbar-button"
      :class="{ active: panelVisible.layer }"
      title="切换图层面板"
      aria-label="切换图层面板"
      @click="editorPanelStore.togglePanel('layer')"
    >
      <Icon icon="fluent:layer-20-filled" />
    </button>
    <button
      type="button"
      class="toolbar-button"
      :class="{ active: panelVisible.property }"
      title="切换属性面板"
      aria-label="切换属性面板"
      @click="editorPanelStore.togglePanel('property')"
    >
      <Icon icon="fluent:panel-right-28-filled" />
    </button>
    <el-divider direction="vertical" />
    <button
      type="button"
      class="toolbar-button"
      :disabled="!canUndo"
      :title="`撤销 (${shortcutLabels.undo})`"
      aria-label="撤销"
      @click="undo"
    >
      <Icon icon="ic:baseline-undo" />
    </button>
    <button
      type="button"
      class="toolbar-button"
      :disabled="!canRedo"
      :title="`重做 (${shortcutLabels.redo})`"
      aria-label="重做"
      @click="redo"
    >
      <Icon icon="ic:baseline-redo" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  gap: 4px;
}

.toolbar-back {
  flex: none;
  text-decoration: none;
}
</style>
