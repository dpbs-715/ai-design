<script setup lang="ts">
import ScreenRenderer from '@/components/ScreenRenderer/index.vue'
import { useWorkspaceStore } from '@/workspace/store.ts'
import type { PageSchema } from '@/schema/page.ts'
import { deepClone } from '@vunio/utils'
import { useRoute } from 'vue-router'

defineOptions({ name: 'ScreenPreview' })

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const page = shallowRef<PageSchema>()
const errorMessage = ref('')
const pageId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''))
const projectId = computed(() =>
  typeof route.query.projectId === 'string' ? route.query.projectId : '',
)
let loadSequence = 0

watch(
  [pageId, projectId],
  async ([currentPageId, currentProjectId]) => {
    const sequence = ++loadSequence
    page.value = undefined
    errorMessage.value = ''
    if (!currentPageId || !currentProjectId) {
      errorMessage.value = '缺少页面预览参数'
      return
    }
    try {
      await workspaceStore.loadProjectAssets(currentProjectId)
      if (sequence !== loadSequence) return
      const pageRecord = workspaceStore.getPage(currentPageId)
      // 运行时的事件脚本会就地修改 schema，克隆以免污染 store 中的持久化记录
      page.value =
        pageRecord?.projectId === currentProjectId ? deepClone(pageRecord.schema) : undefined
      if (!page.value) errorMessage.value = '未找到预览页面'
    } catch (error) {
      if (sequence !== loadSequence) return
      errorMessage.value = error instanceof Error ? error.message : '页面加载失败'
    }
  },
  { immediate: true },
)
</script>

<template>
  <ScreenRenderer v-if="page" :page="page" />
  <div v-else-if="errorMessage" class="screen-state">
    <Icon icon="fluent:error-circle-20-regular" width="26" />
    <strong>{{ errorMessage }}</strong>
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
