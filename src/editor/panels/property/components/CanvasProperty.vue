<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { type CommonFormConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'

defineOptions({
  name: 'CanvasProperty',
})

const editorStore = useEditorStore()
const { canvas } = storeToRefs(editorStore)
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()

const { config } = useConfigs<CommonFormConfig>(
  [
    {
      label: '宽度',
      field: 'width',
      component: 'inputNumber',
      span: 12,
    },
    {
      label: '高度',
      field: 'height',
      component: 'inputNumber',
      span: 12,
    },
    {
      label: '背景色',
      field: 'backgroundColor',
      component: 'color',
      span: 24,
    },
  ],
  false,
)

config.forEach((config) => {
  config.props = {
    onFocus: () => {
      startBatch()
    },
    onBlur: () => {
      commitBatch()
    },
  }
})
</script>

<template>
  <div class="p-20">
    <CommonForm :commandDispatcher="dispatchCommand" v-model="canvas" :config="config" />
  </div>
</template>

<style scoped lang="scss"></style>
