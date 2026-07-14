<script setup lang="ts">
import ScreenRenderer from '@/components/ScreenRenderer/index.vue'
import { getPublishPage } from '@/utils/publish.ts'
import { useRoute } from 'vue-router'

defineOptions({ name: 'ScreenPreview' })

const route = useRoute()

const page = getPublishPage(route.query.id as string)
</script>

<template>
  <ScreenRenderer :page="page" />
</template>

<style scoped lang="scss"></style>
