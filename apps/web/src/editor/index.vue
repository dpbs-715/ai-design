<script setup lang="ts">
import '@/icons/registerEditorIcons.ts'
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
import { toModuleEditorPage } from '@/schema/module.ts'
import { providePublicModules } from '@/context/publicModules.ts'
import { ElMessage } from 'element-plus'
import SchemaLoadingState from '@/components/SchemaLoadingState.vue'

defineOptions({ name: 'ScreenEditor' })

const route = useRoute()
const editorStore = useEditorStore()
const workspaceStore = useWorkspaceStore()
const { modules } = storeToRefs(workspaceStore)
providePublicModules(modules)

const projectId = computed(() => String(route.params.projectId ?? ''))
const pageRouteId = computed(() => String(route.params.pageId ?? ''))
const moduleRouteId = computed(() => String(route.params.moduleId ?? ''))
const project = computed(() => workspaceStore.getProject(projectId.value))
const pageRecord = computed(() => {
  const page = workspaceStore.getPage(pageRouteId.value)
  return page?.projectId === projectId.value ? page : undefined
})
const moduleRecord = computed(() => {
  const publicModule = workspaceStore.modules.find(
    (candidate) => candidate.id === moduleRouteId.value,
  )
  return publicModule?.projectId === projectId.value ? publicModule : undefined
})
const editorAsset = computed(() => pageRecord.value ?? moduleRecord.value)
const editorKind = computed(() => (moduleRecord.value ? '公共模块' : '页面'))
const editorAssetName = computed(() => editorAsset.value?.schema.root.name)
const editorStatus = ref<'loading' | 'ready' | 'missing' | 'error'>('loading')
const editorErrorMessage = ref('')
const workbenchPath = computed(
  () => `/projects/${projectId.value}/${moduleRouteId.value ? 'modules' : 'pages'}`,
)
let loadSequence = 0

function loadEditorPage(page: unknown) {
  const result = editorStore.setPage(page)
  if (result.success === false) {
    throw new Error(result.issues[0]?.message ?? 'Invalid page schema')
  }
}

watch(
  [projectId, pageRouteId, moduleRouteId],
  async ([currentProjectId]) => {
    const sequence = ++loadSequence
    editorStatus.value = 'loading'
    editorErrorMessage.value = ''

    if (!currentProjectId || !project.value) {
      editorStatus.value = 'missing'
      return
    }

    try {
      await workspaceStore.loadProjectAssets(currentProjectId)
      await workspaceStore.loadProjectModuleVersions(currentProjectId)
      if (sequence !== loadSequence) return

      const currentPage = pageRecord.value
      const currentModule = moduleRecord.value
      const workspaceAsset = currentPage ?? currentModule
      if (!workspaceAsset) {
        editorStatus.value = 'missing'
        return
      }

      loadEditorPage(
        deepClone(currentModule ? toModuleEditorPage(currentModule.schema) : workspaceAsset.schema),
      )
      editorStatus.value = 'ready'
      void workspaceStore
        .recordProjectVisit(workspaceAsset.projectId, currentPage ? workspaceAsset.id : undefined)
        .catch(() => undefined)
    } catch (error) {
      if (sequence !== loadSequence) return
      editorStatus.value = 'error'
      editorErrorMessage.value = error instanceof Error ? error.message : '编辑资源加载失败'
      ElMessage.error(editorErrorMessage.value)
    }
  },
  { immediate: true },
)

const { dataSources, theme } = storeToRefs(editorStore)

provideDataSources(dataSources)
provideRenderTheme(theme)

const { isNarrowWorkspace, materialWidth, layerWidth, propertyWidth } = useResponsiveEditorLayout()
</script>

<template>
  <div
    v-if="editorStatus === 'ready'"
    class="editor h-screen select-none"
    :class="{ 'is-narrow': isNarrowWorkspace }"
  >
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
  <SchemaLoadingState
    v-else-if="editorStatus === 'loading'"
    title="正在加载编辑内容"
    description="正在校验 Schema 并初始化编辑器"
  />
  <main v-else class="editor-state">
    <Icon icon="fluent:document-dismiss-20-regular" width="28" />
    <h1>
      {{ editorStatus === 'missing' ? '没有找到这个编辑内容' : '编辑内容加载失败' }}
    </h1>
    <p v-if="editorErrorMessage">{{ editorErrorMessage }}</p>
    <RouterLink :to="workbenchPath">返回项目</RouterLink>
  </main>
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

.editor-state {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: var(--surface-workbench);
  color: var(--text-muted);
  text-align: center;

  h1 {
    margin: 16px 0 0;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 8px 0 0;
    font-size: 11px;
  }

  a {
    margin-top: 18px;
    color: var(--accent-color);
  }
}

@media (max-width: 699px) {
  .editor.is-narrow .editor-title {
    display: none;
  }
}
</style>
