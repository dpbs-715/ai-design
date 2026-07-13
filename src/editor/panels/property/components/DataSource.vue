<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { useConfigs } from '@vunio/hooks'
import type { CommonFormConfig } from '@vunio/ui'

defineOptions({
  name: 'DataSource',
})

const editorStore = useEditorStore()
const { dataSources, selectedNode } = storeToRefs(editorStore)

const { config } = useConfigs<CommonFormConfig>(
  [
    {
      label: '数据源',
      field: 'dataId',
      component: 'commonSelect',
      props: {
        options: dataSources,
        valueField: 'id',
        labelField: 'name',
      },
    },
  ],
  false,
)
</script>

<template>
  <div class="px-15 py-10">
    <CommonForm label-width="" v-model="selectedNode" :config="config" />
  </div>
</template>

<style scoped lang="scss"></style>
