<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { getMaterialSetters } from '@/materials'
import { type CommonFormConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import DataSource from './DataSource.vue'

defineOptions({ name: 'NodeProperty' })

const editorStore = useEditorStore()
const { canvas, selectedNode } = storeToRefs(editorStore)
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()

function withBatchEvents(configs: CommonFormConfig[]) {
  return configs.map((config) => ({
    ...config,
    props: {
      ...config.props,
      onFocus: startBatch,
      onBlur: commitBatch,
    },
  }))
}

const [layoutConfig] = useConfigs<CommonFormConfig>(
  withBatchEvents([
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
  ]),
  false,
)

const nodeSetters = computed(() =>
  withBatchEvents(getMaterialSetters(selectedNode.value.type) ?? []),
)
const [nodeConfig] = useConfigs<CommonFormConfig>(nodeSetters, false)

type PropertySection = 'layout' | 'node'

interface PropertySectionConfig {
  name: PropertySection
  title: string
  config: CommonFormConfig[]
}

const activeSections = ref<PropertySection[]>(['node'])
const activeTab = ref('property')

const sections: PropertySectionConfig[] = [
  { name: 'layout', title: '布局', config: layoutConfig },
  { name: 'node', title: '组件属性', config: nodeConfig },
]

const visible = ref(false)
const jsonText = ref('')
function previewJson() {
  jsonText.value = JSON.stringify(selectedNode.value, null, 2)
  visible.value = true
}

function onConfirm() {
  const newNode = JSON.parse(jsonText.value)
  editorStore.updateNode(selectedNode.value.id, {
    ...newNode,
    id: selectedNode.value.id,
    type: selectedNode.value.type,
  })
  visible.value = false
}
</script>

<template>
  <div class="node-property">
    <div class="node-title">
      <span>{{ selectedNode.name }}</span>
      <span class="cursor-pointer" @click="previewJson">
        <Icon icon="si:json-fill" />
      </span>
    </div>
    <el-tabs v-model="activeTab" stretch>
      <el-tab-pane label="属性" name="property">
        <el-collapse v-model="activeSections">
          <el-collapse-item
            v-for="section in sections"
            :key="section.name"
            :title="section.title"
            :name="section.name"
          >
            <div class="px-15 py-10">
              <Transition name="property-form">
                <CommonForm
                  v-if="activeSections.includes(section.name)"
                  :model-value="section.name === 'layout' ? canvas : selectedNode"
                  :config="section.config"
                  :commandDispatcher="dispatchCommand"
                />
              </Transition>
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-drawer destroy-on-close v-model="visible" title="编辑 JSON" size="800">
          <MonacoEditor v-model="jsonText" />
          <template #footer>
            <CommonButton class="mr-10" type="normal" @click="visible = false">取消</CommonButton>

            <CommonButton type="primary" @click="onConfirm">确认</CommonButton>
          </template>
        </el-drawer>
      </el-tab-pane>
      <el-tab-pane label="数据源" name="dataSource">
        <DataSource />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.node-property {
  .node-title {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: bg-mix(40);
    padding: 0 20px;
  }

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
