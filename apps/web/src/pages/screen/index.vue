<script setup lang="ts">
import ScreenRenderer from '@/components/ScreenRenderer/index.vue'
import { loadWorkspaceSchema } from '@/workspace/persistence.ts'
import { useRoute } from 'vue-router'

defineOptions({ name: 'ScreenPreview' })

const route = useRoute()

const page = computed(() => {
  const pageId = typeof route.query.id === 'string' ? route.query.id : ''
  const schema = loadWorkspaceSchema(pageId)
  if (!schema) throw new Error('未找到发布页面')
  return schema
})
</script>

<template>
  <ScreenRenderer :page="page" />
</template>

<style scoped lang="scss"></style>
