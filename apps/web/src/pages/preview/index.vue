<script setup lang="ts">
import ScreenRenderer from '@/components/ScreenRenderer/index.vue'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'ScreenPreview' })

const editorStore = useEditorStore()
const { page } = storeToRefs(editorStore)
</script>

<template>
  <ScreenRenderer :page="page" />
</template>

<style scoped lang="scss"></style>
