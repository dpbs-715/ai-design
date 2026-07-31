<script setup lang="ts">
import ScreenRenderer from '@/components/ScreenRenderer/index.vue'
import { useWorkspaceStore } from '@/workspace/store.ts'
import type { PageSchema } from '@/schema/page.ts'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'

defineOptions({ name: 'ScreenPreview' })

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const page = shallowRef<PageSchema>()
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
    if (!currentPageId || !currentProjectId) {
      ElMessage.error('缺少页面预览参数')
      return
    }
    try {
      await workspaceStore.loadProjectAssets(currentProjectId)
      if (sequence !== loadSequence) return
      const pageRecord = workspaceStore.getPage(currentPageId)
      page.value = pageRecord?.projectId === currentProjectId ? pageRecord.schema : undefined
      if (!page.value) ElMessage.error('未找到预览页面')
    } catch (error) {
      if (sequence !== loadSequence) return
      ElMessage.error(error instanceof Error ? error.message : '页面加载失败')
    }
  },
  { immediate: true },
)
</script>

<template>
  <ScreenRenderer v-if="page" :page="page" />
</template>

<style scoped lang="scss"></style>
