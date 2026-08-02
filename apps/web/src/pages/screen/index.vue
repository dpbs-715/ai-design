<script setup lang="ts">
import '@/icons/registerEditorIcons.ts'
import ScreenRenderer from '@/components/ScreenRenderer/index.vue'
import { useWorkspaceStore } from '@/workspace/store.ts'
import type { PageSchema } from '@/schema/page.ts'
import { deepClone } from '@vunio/utils'
import { useRoute } from 'vue-router'
import { toModuleEditorPage } from '@/schema/module.ts'
import SchemaLoadingState from '@/components/SchemaLoadingState.vue'
import { consumePreviewSession } from '@/runtime/previewSession.ts'

defineOptions({ name: 'ScreenPreview' })

const route = useRoute()
const workspaceStore = useWorkspaceStore()
type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; page: PageSchema }
  | { status: 'error'; message: string }

const previewState = shallowRef<PreviewState>({ status: 'loading' })
const assetId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''))
const projectId = computed(() =>
  typeof route.query.projectId === 'string' ? route.query.projectId : '',
)
const previewToken = computed(() =>
  typeof route.query.previewToken === 'string' ? route.query.previewToken : '',
)
let loadSequence = 0

watch(
  [assetId, projectId, previewToken],
  async ([currentAssetId, currentProjectId, currentPreviewToken]) => {
    const sequence = ++loadSequence
    previewState.value = { status: 'loading' }
    if (!currentAssetId || !currentProjectId) {
      previewState.value = { status: 'error', message: '缺少预览参数' }
      return
    }
    try {
      await workspaceStore.loadProjectAssets(currentProjectId)
      await workspaceStore.loadProjectModuleVersions(currentProjectId)
      if (sequence !== loadSequence) return
      const previewSession = currentPreviewToken
        ? consumePreviewSession(currentPreviewToken)
        : undefined
      const pageRecord = workspaceStore.getPage(currentAssetId)
      const moduleRecord = workspaceStore.modules.find(
        (candidate) => candidate.id === currentAssetId,
      )
      const schema =
        previewSession?.assetId === currentAssetId && previewSession.projectId === currentProjectId
          ? previewSession.schema
          : pageRecord?.projectId === currentProjectId
            ? pageRecord.schema
            : moduleRecord?.projectId === currentProjectId
              ? toModuleEditorPage(moduleRecord.schema)
              : undefined
      // 运行时的事件脚本会就地修改 schema，克隆以免污染 store 中的持久化记录
      previewState.value = schema
        ? { status: 'ready', page: deepClone(schema) }
        : { status: 'error', message: '未找到预览内容' }
    } catch (error) {
      if (sequence !== loadSequence) return
      previewState.value = {
        status: 'error',
        message: error instanceof Error ? error.message : '预览内容加载失败',
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <SchemaLoadingState
    v-if="previewState.status === 'loading'"
    title="正在加载预览"
    description="正在获取并解析页面 Schema"
  />
  <ScreenRenderer v-else-if="previewState.status === 'ready'" :page="previewState.page" />
  <div v-else class="screen-state">
    <Icon icon="fluent:error-circle-20-regular" width="26" />
    <strong>{{ previewState.message }}</strong>
    <RouterLink class="screen-state-link" :to="{ name: 'Dashboard' }">返回工作台</RouterLink>
  </div>
</template>

<style scoped lang="scss">
.screen-state {
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 13px;

  strong {
    color: var(--text-secondary);
    font-weight: 500;
  }
}

.screen-state-link {
  color: var(--accent-color);
  font-size: 12px;
  text-decoration: none;
}
</style>
