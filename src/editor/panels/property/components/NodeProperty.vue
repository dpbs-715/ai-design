<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { getMaterialSetters } from '@/materials'
import { type CommonFormConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'

defineOptions({ name: 'NodeProperty' })

const editorStore = useEditorStore()
const { selectedNode } = storeToRefs(editorStore)
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()

const setters = getMaterialSetters(selectedNode.value.type)
const { config } = useConfigs<CommonFormConfig>(setters, false)
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
const active = ref('node')
</script>

<template>
  <div class="node-property">
    <el-collapse v-model="active" accordion>
      <el-collapse-item title="布局" name="layout">
        <div class="p-20">
          <CommonForm
            v-model="selectedNode"
            :config="config"
            :commandDispatcher="dispatchCommand"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item title="组件属性" name="node">
        <div class="p-20">
          <CommonForm
            v-model="selectedNode"
            :config="config"
            :commandDispatcher="dispatchCommand"
          />
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped lang="scss">
.node-property {
  :deep(.el-collapse) {
    --el-collapse-border-color: var(--border-color);
    --el-collapse-header-bg-color: transparent;
    --el-collapse-header-text-color: var(--el-text-color-primary);
    --el-collapse-header-font-size: 13px;
    --el-collapse-content-bg-color: transparent;
    --el-collapse-content-font-size: 13px;
    --el-collapse-content-text-color: var(--el-text-color-primary);
    border-top: 1px solid var(--el-collapse-border-color);
    border-bottom: 1px solid var(--el-collapse-border-color);
    .el-collapse-item__title {
      padding-left: 20px;
    }
  }
}
</style>
