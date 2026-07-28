<script setup lang="ts">
import ToolbarLeft from '@/editor/toolbar/ToolbarLeft.vue'
import ToolbarRight from '@/editor/toolbar/ToolbarRight.vue'
import { useEditorStore } from '@/stores/editor.ts'
import MaterialPanel from '@/editor/panels/material/index.vue'
import LayerPanel from '@/editor/panels/layer/index.vue'
import CanvasRoot from '@/editor/canvas/index.vue'
import PropertyPanel from '@/editor/panels/property/index.vue'
import { storeToRefs } from 'pinia'
import { provideDataSources } from '@/context'
import { useRoute } from 'vue-router'
import { useResponsiveEditorLayout } from '@/editor/composables/useResponsiveEditorLayout.ts'
import { provideRenderTheme } from '@/theme/renderTheme.ts'
import { useWorkspaceStore } from '@/workspace/store.ts'
import { deepClone } from '@vunio/utils'

defineOptions({ name: 'ScreenEditor' })

const route = useRoute()
const editorStore = useEditorStore()
const workspaceStore = useWorkspaceStore()

const projectId = computed(() => String(route.params.projectId ?? ''))
const pageRouteId = computed(() => String(route.params.pageId ?? ''))
const moduleRouteId = computed(() => String(route.params.moduleId ?? ''))
const project = computed(() => workspaceStore.getProject(projectId.value))
const pageRecord = computed(() => workspaceStore.getPage(pageRouteId.value))
const moduleRecord = computed(() =>
  workspaceStore.modules.find((publicModule) => publicModule.id === moduleRouteId.value),
)
const editorAsset = computed(() => pageRecord.value ?? moduleRecord.value)
const editorKind = computed(() => (moduleRecord.value ? '公共模块' : '页面'))
const editorAssetName = computed(() => editorAsset.value?.schema.root.name)
let pendingWorkspaceSave: ReturnType<typeof setTimeout> | undefined

function loadEditorPage(page: unknown) {
  const result = editorStore.setPage(page)
  if (result.success === false) {
    throw new Error(result.issues[0]?.message ?? 'Invalid page schema')
  }
}

watch(
  [pageRecord, moduleRecord],
  ([currentPage, currentModule]) => {
    if (pendingWorkspaceSave) clearTimeout(pendingWorkspaceSave)
    const workspaceAsset = currentPage ?? currentModule
    if (workspaceAsset) {
      loadEditorPage(deepClone(workspaceAsset.schema))
      workspaceStore.recordProjectVisit(
        workspaceAsset.projectId,
        currentPage ? workspaceAsset.id : undefined,
      )
      return
    }
  },
  { immediate: true },
)

watch(
  () => editorStore.page,
  (currentPage) => {
    if (!editorAsset.value || currentPage.id !== editorAsset.value.id) return
    if (pendingWorkspaceSave) clearTimeout(pendingWorkspaceSave)
    pendingWorkspaceSave = setTimeout(() => {
      if (pageRecord.value?.id === currentPage.id) {
        workspaceStore.savePageSchema(currentPage.id, currentPage)
      } else if (moduleRecord.value?.id === currentPage.id) {
        workspaceStore.saveModuleSchema(currentPage.id, currentPage)
      }
      pendingWorkspaceSave = undefined
    }, 300)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (pendingWorkspaceSave) {
    clearTimeout(pendingWorkspaceSave)
    if (pageRecord.value?.id === editorStore.page.id) {
      workspaceStore.savePageSchema(editorStore.page.id, editorStore.page)
    } else if (moduleRecord.value?.id === editorStore.page.id) {
      workspaceStore.saveModuleSchema(editorStore.page.id, editorStore.page)
    }
  }
})

const { dataSources, theme } = storeToRefs(editorStore)

provideDataSources(dataSources)
provideRenderTheme(theme)

const { isNarrowWorkspace, materialWidth, layerWidth, propertyWidth } = useResponsiveEditorLayout()
</script>

<template>
  <div class="editor h-screen select-none" :class="{ 'is-narrow': isNarrowWorkspace }">
    <header class="header flex justify-between items-center px-20">
      <ToolbarLeft class="editor-toolbar editor-toolbar-left" />
      <div class="editor-title flex-1 text-center">
        <span v-if="project">{{ project.name }}</span>
        <i v-if="project"></i>
        <strong>{{ editorAssetName ?? '未命名大屏' }}</strong>
        <small v-if="editorAsset">{{ editorKind }}</small>
      </div>
      <ToolbarRight class="editor-toolbar editor-toolbar-right" />
    </header>
    <main class="editor-main flex">
      <!--  物料  -->
      <MaterialPanel
        class="material overflow-hidden transition-all"
        :style="{ width: materialWidth }"
      />
      <!--  图层  -->
      <LayerPanel class="layer overflow-hidden transition-all" :style="{ width: layerWidth }" />
      <!--  画布  -->
      <CanvasRoot class="canvas flex-1" />
      <!--  属性  -->
      <PropertyPanel
        class="property overflow-hidden transition-all"
        :style="{ width: propertyWidth }"
      />
    </main>
  </div>
</template>

<style scoped lang="scss">
.editor {
  background: var(--surface-workbench);
  color: var(--text-primary);

  .header {
    position: relative;
    z-index: 10;
    height: var(--editor-header-height);
    gap: 12px;
    background: var(--surface-panel);
    border-bottom: 1px solid var(--border-color);
  }

  .editor-toolbar {
    width: 500px;
    min-width: 0;
  }

  .editor-title {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
    gap: 7px;
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;

    span {
      overflow: hidden;
      color: var(--text-muted);
      text-overflow: ellipsis;
    }

    i {
      width: 3px;
      height: 3px;
      flex: none;
      border-radius: 50%;
      background: var(--border-color-strong);
    }

    strong {
      overflow: hidden;
      color: var(--text-secondary);
      font-weight: 600;
      text-overflow: ellipsis;
    }

    small {
      flex: none;
      padding: 3px 6px;
      border-radius: 99px;
      background: var(--accent-soft);
      color: var(--accent-color);
      font-size: 9px;
    }
  }

  .editor-main {
    height: calc(100% - var(--editor-header-height));
  }

  .material {
    border-right: 1px solid var(--border-color);
  }

  .property {
    background: var(--surface-panel);
    border-left: 1px solid var(--border-color);
  }

  .canvas {
    min-width: 0;
  }

  &.is-narrow {
    .header {
      gap: 8px;
      padding-right: 12px;
      padding-left: 12px;
    }

    .editor-toolbar {
      width: auto;
      flex: none;
    }
  }
}

@media (max-width: 699px) {
  .editor.is-narrow .editor-title {
    display: none;
  }
}
</style>
