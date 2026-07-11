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

const setters = computed(() => getMaterialSetters(selectedNode.value.type))

const [layoutConfig] = useConfigs<CommonFormConfig>(
  [
    {
      label: '宽度',
      field: 'width',
      component: 'number',
      span: 12,
    },
    {
      label: '高度',
      field: 'height',
      component: 'number',
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
addBatchEvent(layoutConfig)

const [nodeConfig] = useConfigs<CommonFormConfig>(setters, false)

function addBatchEvent(configs: CommonFormConfig[]) {
  configs.forEach((config) => {
    config.props = {
      ...(config.props ?? {}),
      onFocus: () => {
        startBatch()
      },
      onBlur: () => {
        commitBatch()
      },
    }
  })
}

type PropertySection = 'layout' | 'node'

interface PropertySectionConfig {
  name: PropertySection
  title: string
  config: CommonFormConfig[]
}

const activeSections = ref<PropertySection[]>(['node'])
const sections: PropertySectionConfig[] = [
  { name: 'layout', title: '布局', config: layoutConfig },
  { name: 'node', title: '组件属性', config: nodeConfig },
]
</script>

<template>
  <div class="node-property">
    <el-collapse v-model="activeSections">
      <el-collapse-item
        v-for="section in sections"
        :key="section.name"
        :title="section.title"
        :name="section.name"
      >
        <div class="px-15 py-20">
          <Transition name="property-form">
            <CommonForm
              v-if="activeSections.includes(section.name)"
              v-model="selectedNode"
              :config="section.config"
              :commandDispatcher="dispatchCommand"
            />
          </Transition>
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

.property-form-enter-active,
.property-form-leave-active {
  transition: opacity var(--el-transition-duration);
}

.property-form-enter-from,
.property-form-leave-to {
  opacity: 0;
}
</style>
