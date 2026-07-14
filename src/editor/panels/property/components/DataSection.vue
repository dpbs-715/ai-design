<script setup lang="ts">
import type { CommonFormConfig } from '@vunio/ui'
import { getByKeyOrPath } from '@vunio/utils'
import { storeToRefs } from 'pinia'
import { fetchData } from '@/hooks/useDataSource.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { getMaterialDataBindings } from '@/materials'
import { useEditorStore } from '@/stores/editor.ts'

defineOptions({ name: 'PropertyDataSection' })

const emit = defineEmits<{
  openSourceManager: []
}>()

const editorStore = useEditorStore()
const { dataSources, selectedNode: selectedNodeRef } = storeToRefs(editorStore)
const { dispatchCommand } = useUndoRedo()

const selectedNode = computed(() => selectedNodeRef.value!)
const dataBindings = computed(() => getMaterialDataBindings(selectedNode.value.type))
const supportsDataBinding = computed(() => dataBindings.value.length > 0)
const selectedSource = computed(() =>
  dataSources.value.find((source) => source.id === selectedNode.value.dataId),
)
const dataSourceOptions = computed(() =>
  dataSources.value.map((source) => ({ id: source.id, name: source.name })),
)

const sourceConfig = computed<CommonFormConfig[]>(() => [
  {
    label: '数据源',
    field: 'dataId',
    component: 'commonSelect',
    props: {
      options: dataSourceOptions.value,
      valueField: 'id',
      labelField: 'name',
      clearable: true,
      placeholder: '选择数据源',
    },
  },
])

type PreviewRow = Record<string, unknown>

const previewRows = ref<PreviewRow[]>([])
const previewRecordCount = ref(0)
const previewLoading = ref(false)
const previewError = ref('')
let previewRequestId = 0

function normalizeRows(payload: unknown): PreviewRow[] {
  const rows = Array.isArray(payload) ? payload : payload == null ? [] : [payload]
  previewRecordCount.value = rows.length
  return rows.slice(0, 5).map((row) => {
    if (row !== null && typeof row === 'object' && !Array.isArray(row)) {
      return row as PreviewRow
    }
    return { value: row }
  })
}

async function loadPreview() {
  const requestId = ++previewRequestId
  const source = selectedSource.value
  previewError.value = ''

  if (!source) {
    previewRows.value = []
    previewRecordCount.value = 0
    return
  }

  previewLoading.value = true
  try {
    const payload = source.type === 'static' ? source.data : await fetchData(source)
    if (requestId === previewRequestId) previewRows.value = normalizeRows(payload)
  } catch (error) {
    if (requestId === previewRequestId) {
      previewRows.value = []
      previewRecordCount.value = 0
      previewError.value = error instanceof Error ? error.message : '数据加载失败'
    }
  } finally {
    if (requestId === previewRequestId) previewLoading.value = false
  }
}

watch(selectedSource, () => void loadPreview(), { immediate: true })

const previewFields = computed(() => {
  const fields = new Set<string>()
  previewRows.value.slice(0, 5).forEach((row) => {
    Object.keys(row).forEach((field) => fields.add(field))
  })
  dataBindings.value.forEach((binding) => {
    const currentField = getByKeyOrPath(selectedNode.value, binding.field)
    if (typeof currentField === 'string') fields.add(currentField)
  })
  return [...fields]
})

const fieldOptions = computed(() =>
  previewFields.value.map((field) => ({ label: field, value: field })),
)

const bindingConfig = computed<CommonFormConfig[]>(() =>
  dataBindings.value.map((binding) => ({
    label: binding.label,
    field: binding.field,
    component: 'commonSelect',
    props: {
      options: fieldOptions.value,
      clearable: true,
      filterable: true,
      placeholder: '选择字段',
    },
  })),
)

const sourceSummary = computed(() => {
  const source = selectedSource.value
  if (!source) return ''
  if (source.type === 'api') return `API · ${(source.method ?? 'get').toUpperCase()}`
  return `静态数据 · ${previewRecordCount.value} 条`
})

const visibleFields = computed(() => previewFields.value.slice(0, 3))

function formatCell(value: unknown) {
  if (value == null) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function openSourceManager() {
  emit('openSourceManager')
}
</script>

<template>
  <div class="data-section">
    <template v-if="supportsDataBinding">
      <section class="property-group">
        <div class="group-heading">
          <div>
            <h3>数据源</h3>
            <p v-if="selectedSource">{{ sourceSummary }}</p>
          </div>
          <button type="button" class="text-action" @click="openSourceManager">管理</button>
        </div>
        <CommonForm
          label-position="top"
          :model-value="selectedNode"
          :config="sourceConfig"
          :command-dispatcher="dispatchCommand"
        />
      </section>

      <template v-if="selectedSource">
        <section class="property-group">
          <div class="group-heading">
            <div>
              <h3>字段映射</h3>
              <p>从当前数据结构中选择图表字段</p>
            </div>
          </div>
          <CommonForm
            label-position="top"
            :model-value="selectedNode"
            :config="bindingConfig"
            :command-dispatcher="dispatchCommand"
          />
        </section>

        <section class="property-group preview-group">
          <div class="group-heading">
            <div>
              <h3>数据预览</h3>
              <p>{{ previewRecordCount }} 条记录</p>
            </div>
            <button
              type="button"
              class="icon-action"
              aria-label="刷新数据预览"
              @click="loadPreview"
            >
              <Icon icon="fluent:arrow-clockwise-20-regular" width="16" />
            </button>
          </div>

          <div v-if="previewError" class="preview-state error-state">
            <Icon icon="fluent:error-circle-20-regular" width="18" />
            <span>{{ previewError }}</span>
          </div>
          <div v-else-if="previewLoading" class="preview-state">
            <Icon class="loading-icon" icon="fluent:arrow-clockwise-20-regular" width="18" />
            <span>正在加载数据</span>
          </div>
          <div v-else-if="previewRows.length" class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>
                  <th v-for="field in visibleFields" :key="field">{{ field }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewRows" :key="index">
                  <td v-for="field in visibleFields" :key="field" :title="formatCell(row[field])">
                    {{ formatCell(row[field]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="preview-state">
            <Icon icon="fluent:table-simple-20-regular" width="18" />
            <span>当前数据源没有可预览的记录</span>
          </div>
        </section>
      </template>

      <div v-else class="empty-state">
        <Icon icon="fluent:database-20-regular" width="24" />
        <strong>选择一个数据源</strong>
        <span>绑定后可以配置字段映射并预览数据</span>
      </div>
    </template>

    <div v-else class="empty-state unsupported-state">
      <Icon icon="fluent:database-20-regular" width="24" />
      <strong>该组件暂不支持数据绑定</strong>
      <span>当前组件没有声明可映射的数据字段</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-section {
  min-height: 100%;
}

.property-group {
  padding: 16px 14px;
  border-bottom: 1px solid var(--border-color);
}

.group-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h3 {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
  }

  p {
    margin-top: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
}

.text-action,
.icon-action {
  border: 0;
  background: transparent;
  color: var(--accent-color);
  cursor: pointer;
}

.text-action {
  padding: 2px 0;
  font-size: 12px;
}

.icon-action {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 4px;

  &:hover {
    background: var(--surface-hover);
  }
}

.preview-table-wrap {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 5px;
}

.preview-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12px;

  th,
  td {
    overflow: hidden;
    padding: 7px 8px;
    border-right: 1px solid var(--border-color);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:last-child {
      border-right: 0;
    }
  }

  th {
    background: var(--surface-raised);
    color: var(--text-secondary);
    font-weight: 500;
  }

  td {
    border-top: 1px solid var(--border-color);
    color: var(--text-muted);
  }
}

.preview-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.preview-state {
  min-height: 88px;
  gap: 8px;
  border: 1px dashed var(--border-color);
  border-radius: 5px;
  font-size: 12px;
}

.error-state {
  color: var(--el-color-danger);
}

.loading-icon {
  animation: preview-loading 900ms linear infinite;
}

.empty-state {
  min-height: 190px;
  flex-direction: column;
  gap: 7px;
  padding: 24px;
  text-align: center;

  strong {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
  }

  span {
    max-width: 210px;
    font-size: 12px;
    line-height: 1.6;
  }
}

.unsupported-state {
  min-height: 300px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

:deep(.el-form-item__label) {
  margin-bottom: 5px;
  color: var(--text-muted);
  font-size: 12px;
}

@keyframes preview-loading {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-icon {
    animation: none;
  }
}
</style>
