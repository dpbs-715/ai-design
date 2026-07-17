<script setup lang="ts">
import type { CommonFormConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import DataSourceManager from '@/editor/toolbar/components/DataSourceManager.vue'
import DataSection from '@/editor/panels/property/components/DataSection.vue'
import EventSection from '@/editor/panels/property/components/EventSection.vue'
import EventWorkbench from '@/editor/panels/property/components/EventWorkbench.vue'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { getMaterialSetters } from '@/materials'
import type { MaterialEvent } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'

defineOptions({ name: 'NodeProperty' })

type PropertySection = 'layout' | 'appearance' | 'data' | 'event'

interface PropertySectionOption {
  name: PropertySection
  label: string
  icon: string
}

interface DataSourceManagerExpose {
  save: () => boolean | void
}

interface EventWorkbenchExpose {
  getDraft: () => MaterialEvent
}

const sectionOptions: PropertySectionOption[] = [
  { name: 'layout', label: '布局', icon: 'fluent:resize-20-regular' },
  { name: 'appearance', label: '外观', icon: 'fluent:paint-brush-20-regular' },
  { name: 'data', label: '数据', icon: 'fluent:database-20-regular' },
  { name: 'event', label: '事件', icon: 'fluent:flash-20-regular' },
]

const editorStore = useEditorStore()
const { selectedNode: selectedNodeRef } = storeToRefs(editorStore)
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()
const selectedNode = computed(() => selectedNodeRef.value!)

const activeSection = ref<PropertySection>('appearance')
const componentIcon = computed(() =>
  selectedNode.value.type === 'text'
    ? 'fluent:text-font-20-filled'
    : 'fluent:data-bar-vertical-20-filled',
)

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
    { label: 'X', field: 'x', component: 'number', span: 12 },
    { label: 'Y', field: 'y', component: 'number', span: 12 },
    { label: '宽度', field: 'width', component: 'number', span: 12 },
    { label: '高度', field: 'height', component: 'number', span: 12 },
  ]),
  false,
)

const nodeSetters = computed(() =>
  withBatchEvents(getMaterialSetters(selectedNode.value.type) ?? []),
)
const [appearanceConfig] = useConfigs<CommonFormConfig>(nodeSetters, false)

const jsonVisible = ref(false)
const jsonText = ref('')
const sourceManagerVisible = ref(false)
const eventEditorVisible = ref(false)
const editedEventIndex = ref(0)
const dataSourceManagerRef = useTemplateRef<DataSourceManagerExpose>('dataSourceManager')
const eventWorkbenchRef = useTemplateRef<EventWorkbenchExpose>('eventWorkbench')

const editedEvent = computed(() => selectedNode.value.events?.[editedEventIndex.value])

function previewJson() {
  jsonText.value = JSON.stringify(selectedNode.value, null, 2)
  jsonVisible.value = true
}

function closeJsonEditor() {
  jsonVisible.value = false
}

function confirmJson() {
  try {
    const newNode = JSON.parse(jsonText.value)
    editorStore.updateNode(selectedNode.value.id, {
      ...newNode,
      id: selectedNode.value.id,
      type: selectedNode.value.type,
    })
    jsonVisible.value = false
  } catch {
    ElMessage.error('请检查 JSON 是否合法')
  }
}

function openSourceManager() {
  sourceManagerVisible.value = true
}

function closeSourceManager() {
  sourceManagerVisible.value = false
}

function saveSourceManager() {
  const saved = dataSourceManagerRef.value?.save()
  if (saved !== false) sourceManagerVisible.value = false
}

function openCodeEditor(eventIndex: number) {
  editedEventIndex.value = eventIndex
  eventEditorVisible.value = true
}

function closeCodeEditor() {
  eventEditorVisible.value = false
}

function saveEventCode() {
  const draft = eventWorkbenchRef.value?.getDraft()
  if (!draft) return
  const events = [...(selectedNode.value.events ?? [])]
  events[editedEventIndex.value] = draft
  editorStore.updateNode(selectedNode.value.id, { ...selectedNode.value, events })
  eventEditorVisible.value = false
}

watch(
  () => selectedNodeRef.value?.id,
  () => {
    jsonVisible.value = false
    eventEditorVisible.value = false
  },
)
</script>

<template>
  <div class="node-property">
    <header class="node-header">
      <div class="node-identity">
        <span class="node-icon icon-tile"><Icon :icon="componentIcon" width="18" /></span>
        <span class="node-copy">
          <strong>{{ selectedNode.name }}</strong>
          <small>{{ selectedNode.type }}</small>
        </span>
      </div>

      <el-dropdown trigger="click">
        <button type="button" class="header-more icon-button" aria-label="更多组件操作">
          <Icon icon="fluent:more-horizontal-20-regular" width="18" />
        </button>
        <template #dropdown>
          <el-dropdown-item @click="previewJson">
            <Icon class="mr-8" icon="fluent:code-20-regular" width="16" />
            编辑组件 JSON
          </el-dropdown-item>
        </template>
      </el-dropdown>
    </header>

    <div class="property-body">
      <nav class="rail-nav" aria-label="组件属性分区">
        <button
          v-for="section in sectionOptions"
          :key="section.name"
          type="button"
          :class="{ active: activeSection === section.name }"
          :aria-pressed="activeSection === section.name"
          @click="activeSection = section.name"
        >
          <Icon :icon="section.icon" width="18" />
          <span>{{ section.label }}</span>
        </button>
      </nav>

      <main class="section-content">
        <section v-if="activeSection === 'layout'" class="property-section">
          <div class="content-heading">
            <h2>布局</h2>
            <span>位置与尺寸</span>
          </div>
          <div class="form-area layout-form">
            <CommonForm
              label-position="top"
              :model-value="selectedNode.layout"
              :config="layoutConfig"
              :command-dispatcher="dispatchCommand"
            />
          </div>
        </section>

        <section v-else-if="activeSection === 'appearance'" class="property-section">
          <div class="content-heading">
            <h2>外观</h2>
            <span>内容与视觉样式</span>
          </div>
          <div class="form-area">
            <CommonForm
              label-position="top"
              :model-value="selectedNode"
              :config="appearanceConfig"
              :command-dispatcher="dispatchCommand"
            />
          </div>
        </section>

        <section v-else-if="activeSection === 'data'" class="property-section">
          <div class="content-heading">
            <h2>数据</h2>
            <span>绑定与字段映射</span>
          </div>
          <DataSection @open-source-manager="openSourceManager" />
        </section>

        <section v-else class="property-section">
          <div class="content-heading">
            <h2>事件</h2>
            <span>触发与处理代码</span>
          </div>
          <EventSection @open-code-editor="openCodeEditor" />
        </section>
      </main>
    </div>

    <el-drawer v-model="jsonVisible" destroy-on-close title="编辑组件 JSON" :size="720">
      <MonacoEditor v-model="jsonText" />
      <template #footer>
        <CommonButton class="mr-10" type="normal" @click="closeJsonEditor">取消</CommonButton>
        <CommonButton type="primary" @click="confirmJson">保存</CommonButton>
      </template>
    </el-drawer>

    <el-drawer v-model="sourceManagerVisible" destroy-on-close title="管理数据源" :size="720">
      <DataSourceManager ref="dataSourceManager" />
      <template #footer>
        <CommonButton class="mr-10" type="normal" @click="closeSourceManager"> 取消 </CommonButton>
        <CommonButton type="primary" @click="saveSourceManager">保存数据源</CommonButton>
      </template>
    </el-drawer>

    <el-drawer v-model="eventEditorVisible" destroy-on-close title="事件代码编辑器" :size="720">
      <EventWorkbench v-if="editedEvent" ref="eventWorkbench" :event="editedEvent" />
      <template #footer>
        <CommonButton class="mr-10" type="normal" @click="closeCodeEditor">取消</CommonButton>
        <CommonButton type="primary" @click="saveEventCode">保存代码</CommonButton>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.node-property {
  display: flex;
  height: 100%;
  min-width: 0;
  flex-direction: column;
  background: var(--surface-panel);
}

.node-header {
  display: flex;
  height: 54px;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface-panel);
}

.node-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}

.node-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 11px;
  }
}

.property-body {
  display: flex;
  min-height: 0;
  flex: 1;
}

.section-content {
  min-width: 0;
  flex: 1;
  overflow: auto;
  background: var(--surface-panel);
}

.form-area {
  padding: 16px 14px;
}

:deep(.el-form-item) {
  margin-bottom: 14px;
}

:deep(.el-input-number),
:deep(.el-select) {
  width: 100%;
}
</style>
