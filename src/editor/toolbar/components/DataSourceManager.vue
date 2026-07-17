<script setup lang="ts">
import { useConfigs } from '@vunio/hooks'
import type { CommonFormConfig } from '@vunio/ui'
import { deepClone } from '@vunio/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import MonacoEditor from '@/components/MonacoEditor/index.vue'
import { fetchData } from '@/hooks/useDataSource.ts'
import type { DataSourceSchema } from '@/schema/page.ts'
import { useEditorStore } from '@/stores/editor.ts'

defineOptions({ name: 'DataSourceManager' })

type EditableDataSource = Omit<DataSourceSchema, 'data' | 'params'> & {
  data?: string
  params?: string
}

const editorStore = useEditorStore()
const { dataSources, nodes } = storeToRefs(editorStore)

const sources = ref<EditableDataSource[]>(
  deepClone(dataSources.value).map((source) => ({
    ...source,
    data: source.data === undefined ? undefined : JSON.stringify(source.data, null, 2),
    params: source.params === undefined ? undefined : JSON.stringify(source.params, null, 2),
  })),
)
const activeSourceId = ref(sources.value[0]?.id ?? '')
const responseText = ref('')
const requestLoading = ref(false)

const activeSource = computed<EditableDataSource | undefined>({
  get: () => sources.value.find((source) => source.id === activeSourceId.value),
  set: (source) => {
    const sourceIndex = sources.value.findIndex(
      (candidate) => candidate.id === activeSourceId.value,
    )
    if (source && sourceIndex >= 0) sources.value[sourceIndex] = source
  },
})

const isStaticSource = computed(() => activeSource.value?.type === 'static')
const isApiSource = computed(() => activeSource.value?.type === 'api')

const { config } = useConfigs<CommonFormConfig>([
  { label: '名称', field: 'name', component: 'input' },
  {
    label: '类型',
    field: 'type',
    component: 'radioGroup',
    props: {
      radioType: 'button',
      options: [
        { label: '静态数据', value: 'static' },
        { label: 'API', value: 'api' },
      ],
    },
  },
  {
    label: '静态数据',
    field: 'data',
    hidden: isApiSource,
    component: MonacoEditor,
  },
  {
    label: '请求地址',
    field: 'url',
    hidden: isStaticSource,
    component: 'input',
    props: { placeholder: 'https://api.example.com/data' },
  },
  {
    label: '请求方式',
    field: 'method',
    hidden: isStaticSource,
    component: 'radioGroup',
    props: {
      radioType: 'button',
      options: [
        { label: 'GET', value: 'get' },
        { label: 'POST', value: 'post' },
      ],
    },
  },
  {
    label: '轮询周期（毫秒）',
    field: 'interval',
    hidden: isStaticSource,
    component: 'number',
    props: { min: 0, placeholder: '0 表示不轮询' },
  },
  {
    label: '请求参数',
    field: 'params',
    component: MonacoEditor,
    hidden: isStaticSource,
  },
  {
    label: '响应路径',
    field: 'responsePath',
    hidden: isStaticSource,
    component: 'input',
    props: { placeholder: '例如 data.list' },
  },
  { label: '请求预览', field: 'previewApi', hidden: isStaticSource },
])

function selectSource(sourceId: string) {
  activeSourceId.value = sourceId
  responseText.value = ''
}

function addSource() {
  const source: EditableDataSource = {
    id: crypto.randomUUID(),
    name: '未命名数据源',
    type: 'static',
    data: '[]',
    params: '{}',
  }
  sources.value.push(source)
  selectSource(source.id)
}

function sourceUsageCount(sourceId: string) {
  return nodes.value.filter((node) => node.dataId === sourceId).length
}

async function removeSource(source: EditableDataSource) {
  const usageCount = sourceUsageCount(source.id)
  const message = usageCount
    ? `有 ${usageCount} 个组件正在使用“${source.name}”，删除后这些组件将失去数据绑定。`
    : `确定删除“${source.name}”吗？`
  try {
    await ElMessageBox.confirm(message, '删除数据源', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  sources.value = sources.value.filter((candidate) => candidate.id !== source.id)
  if (activeSourceId.value === source.id) activeSourceId.value = sources.value[0]?.id ?? ''
}

function parseJson(value: string | undefined, fallback: unknown) {
  return value?.trim() ? JSON.parse(value) : fallback
}

async function testRequest() {
  const source = activeSource.value
  if (!source || source.type !== 'api') return
  requestLoading.value = true
  responseText.value = ''
  try {
    const result = await fetchData({
      ...source,
      data: undefined,
      params: parseJson(source.params, {}),
    })
    responseText.value = JSON.stringify(result, null, 2)
  } catch (error) {
    responseText.value = JSON.stringify(
      { error: error instanceof Error ? error.message : '请求失败' },
      null,
      2,
    )
  } finally {
    requestLoading.value = false
  }
}

function save() {
  try {
    editorStore.page.dataSources = sources.value.map((source) => ({
      ...source,
      data: parseJson(source.data, []),
      params: parseJson(source.params, {}),
    }))
    ElMessage.success('数据源已保存')
    return true
  } catch {
    ElMessage.error('请检查静态数据或请求参数的 JSON 格式')
    return false
  }
}

defineExpose({ save })
</script>

<template>
  <div class="source-workbench editor-pane">
    <aside class="source-sidebar">
      <div class="sidebar-heading">
        <span>数据源</span>
        <button type="button" aria-label="新增数据源" @click="addSource">
          <Icon icon="fluent:add-16-regular" width="16" />
        </button>
      </div>
      <div class="source-list">
        <div
          v-for="source in sources"
          :key="source.id"
          class="source-row"
          :class="{ active: source.id === activeSourceId }"
        >
          <button type="button" class="source-main" @click="selectSource(source.id)">
            <span class="source-icon">
              <Icon
                :icon="
                  source.type === 'api'
                    ? 'fluent:cloud-arrow-down-20-regular'
                    : 'fluent:table-20-regular'
                "
                width="16"
              />
            </span>
            <span class="source-copy">
              <strong>{{ source.name }}</strong>
              <small
                >{{ source.type === 'api' ? 'API' : '静态数据' }} ·
                {{ sourceUsageCount(source.id) }} 个组件</small
              >
            </span>
          </button>
          <el-dropdown trigger="click" @command="removeSource(source)">
            <button type="button" class="source-more" :aria-label="`管理${source.name}`">
              <Icon icon="fluent:more-horizontal-20-regular" width="16" />
            </button>
            <template #dropdown>
              <el-dropdown-item command="remove">删除数据源</el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
      </div>
    </aside>

    <main class="source-editor">
      <template v-if="activeSource">
        <header class="editor-heading">
          <div>
            <span class="eyebrow">{{
              activeSource.type === 'api' ? 'API 数据源' : '静态数据源'
            }}</span>
            <h3>{{ activeSource.name }}</h3>
          </div>
          <span class="source-id">{{ activeSource.id.slice(0, 8) }}</span>
        </header>

        <div class="source-form">
          <CommonForm v-model="activeSource" label-position="top" :config="config">
            <template #previewApi>
              <div class="request-preview">
                <div class="preview-heading">
                  <div>
                    <strong>响应预览</strong>
                    <span>测试当前请求配置</span>
                  </div>
                  <CommonButton
                    type="primary"
                    size="small"
                    :loading="requestLoading"
                    @click="testRequest"
                  >
                    测试请求
                  </CommonButton>
                </div>
                <MonacoEditor v-model="responseText" class="response-editor" lang="json" />
              </div>
            </template>
          </CommonForm>
        </div>
      </template>

      <div v-else class="empty-state">
        <Icon icon="fluent:database-20-regular" width="26" />
        <strong>新建或选择数据源</strong>
        <span>静态数据和 API 数据源会在页面内共享</span>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.source-workbench {
  display: grid;
  height: calc(100vh - 150px);
  min-height: 520px;
  grid-template-columns: 190px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: var(--surface-panel);
}

.source-sidebar {
  min-width: 0;
  border-right: 1px solid var(--border-color);
  background: var(--surface-workbench);
}

.sidebar-heading {
  display: flex;
  height: 44px;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 12px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;

  button {
    display: grid;
    width: 26px;
    height: 26px;
    place-items: center;
    border: 0;
    border-radius: 4px;
    background: var(--accent-soft);
    color: var(--accent-color);
    cursor: pointer;

    &:hover {
      background: var(--accent-soft-hover);
    }
  }
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}

.source-row {
  display: flex;
  min-width: 0;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 5px;

  &:hover {
    background: var(--surface-raised);
  }

  &.active {
    border-color: color-mix(in srgb, var(--accent-color) 34%, transparent);
    background: var(--accent-soft);
  }
}

.source-main {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.source-icon {
  display: grid;
  width: 26px;
  height: 26px;
  flex: none;
  place-items: center;
  border-radius: 4px;
  background: var(--surface-raised);
  color: var(--text-muted);

  .active & {
    background: var(--accent-soft-hover);
    color: var(--accent-color);
  }
}

.source-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;

  strong {
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 12px;
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

.source-more {
  display: grid;
  width: 26px;
  height: 26px;
  margin-right: 4px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    background: var(--surface-workbench);
    color: var(--text-primary);
  }
}

.source-editor {
  min-width: 0;
  overflow: auto;
}

.editor-heading {
  display: flex;
  height: 66px;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin-top: 3px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
  }
}

.eyebrow {
  color: var(--accent-color);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.source-id {
  color: var(--text-muted);
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;
}

.source-form {
  padding: 18px;
}

.request-preview {
  width: 100%;
}

.preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;

  > div {
    display: flex;
    flex-direction: column;
  }

  strong {
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 500;
  }

  span {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 11px;
  }
}

.response-editor {
  height: 280px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  overflow: hidden;
}

.empty-state {
  height: 100%;
}

:deep(.el-input-number),
:deep(.el-select) {
  width: 100%;
}
</style>
