<script setup lang="ts">
import {
  CommonTable,
  SetFormFieldCommand,
  type CommonFormCommand,
  type CommonFormConfig,
  type CommonTableConfig,
} from '@vunio/ui'
import { getByKeyOrPath } from '@vunio/utils'
import { storeToRefs } from 'pinia'
import { fetchData } from '@/hooks/useDataSource.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { getMaterialDataBindings } from '@/materials'
import { resolveDataQuery } from '@/runtime/dataQuery.ts'
import { isFormItemPlacement, type MaterialDataQueryParam } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'

defineOptions({ name: 'PropertyDataSection' })

const props = withDefaults(
  defineProps<{
    config?: CommonFormConfig[]
    commandDispatcher?: (command: CommonFormCommand) => void
  }>(),
  {
    config: () => [],
    commandDispatcher: undefined,
  },
)

const emit = defineEmits<{
  openSourceManager: []
}>()

const editorStore = useEditorStore()
const { dataSources, nodes, selectedNode: selectedNodeRef } = storeToRefs(editorStore)
const { dispatchCommand } = useUndoRedo()

const selectedNode = computed(() => selectedNodeRef.value!)
const dataBindings = computed(() => getMaterialDataBindings(selectedNode.value.type))
const hasComponentData = computed(() => props.config.length > 0)
const supportsDataBinding = computed(() => dataBindings.value.length > 0)
const selectedSource = computed(() =>
  dataSources.value.find((source) => source.id === selectedNode.value.dataId),
)
const isApiSource = computed(() => selectedSource.value?.type === 'api')
const dataSourceOptions = computed(() =>
  dataSources.value.map((source) => ({ id: source.id, name: source.name })),
)
const formItemOptions = computed(() =>
  nodes.value
    .filter(
      (node) => isFormItemPlacement(node.placement) && node.id !== selectedNode.value.id,
    )
    .map((node) => ({
      label: `${node.name} · ${String(node.props.field ?? node.id)}`,
      value: node.id,
    })),
)
const dynamicParams = computed(() => selectedNode.value.dataQuery?.params ?? [])

const dynamicParamConfig = computed<CommonFormConfig[]>(() => [
  {
    label: '参数名',
    field: 'name',
    component: 'input',
    span: 24,
    props: { placeholder: '例如 provinceId' },
  },
  {
    label: '值来源',
    field: 'source.nodeId',
    component: 'commonSelect',
    span: 18,
    props: {
      options: formItemOptions.value,
      componentType: 'ElSelect',
      clearable: false,
      filterable: true,
      placeholder: '选择表单项',
    },
  },
  {
    label: '必填',
    field: 'required',
    component: 'switch',
    span: 6,
  },
])

const debounceConfig = computed<CommonFormConfig[]>(() => [
  {
    label: '请求防抖（毫秒）',
    field: 'dataQuery.debounce',
    component: 'number',
    props: {
      min: 0,
      precision: 0,
      placeholder: '0 表示立即请求',
    },
  },
])

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

const previewQuery = computed(() =>
  resolveDataQuery(selectedNode.value.dataQuery, (nodeId) => {
    return editorStore.findNode(nodeId)?.props.initialValue
  }),
)

function dispatchNodeCommand(command: CommonFormCommand) {
  const dispatcher = props.commandDispatcher ?? dispatchCommand
  dispatcher(command)
}

function setDataQuery(params: MaterialDataQueryParam[]) {
  const nodeId = selectedNode.value.id
  const nextQuery = {
    params,
    debounce: selectedNode.value.dataQuery?.debounce ?? 0,
  }
  dispatchNodeCommand(
    new SetFormFieldCommand(() => editorStore.requireNode(nodeId), 'dataQuery', nextQuery),
  )
}

function addDynamicParam() {
  const sourceNodeId = formItemOptions.value[0]?.value
  if (!sourceNodeId) return
  const usedNames = new Set(dynamicParams.value.map((param) => param.name))
  let index = dynamicParams.value.length + 1
  while (usedNames.has(`param${index}`)) index += 1

  setDataQuery([
    ...dynamicParams.value,
    {
      id: crypto.randomUUID(),
      name: `param${index}`,
      source: {
        type: 'form-item',
        nodeId: sourceNodeId,
      },
      required: true,
    },
  ])
}

function removeDynamicParam(paramId: string) {
  setDataQuery(dynamicParams.value.filter((param) => param.id !== paramId))
}

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
    if (source.type === 'api' && !previewQuery.value.ready) {
      previewRows.value = []
      previewRecordCount.value = 0
      previewError.value = '必填动态参数没有可用的表单初始值'
      return
    }
    const payload =
      source.type === 'static'
        ? source.data
        : await fetchData(source, previewQuery.value.params)
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

watch([selectedSource, previewQuery], () => void loadPreview(), { immediate: true })

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
      componentType: 'ElSelect',
      allowCreate: true,
      clearable: true,
      defaultFirstOption: true,
      filterable: true,
      reserveKeyword: false,
      placeholder: '选择字段或输入路径',
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

const previewTableConfig = computed<CommonTableConfig[]>(() =>
  visibleFields.value.map((field) => ({
    label: field,
    field,
    minWidth: 88,
    formatter: (row: PreviewRow) => formatCell(row[field]),
  })),
)

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
    <section v-if="hasComponentData" class="property-group">
      <div class="section-heading">
        <div>
          <h3>组件数据</h3>
          <p>配置组件的初始值</p>
        </div>
      </div>
      <CommonForm
        label-position="top"
        :model-value="selectedNode"
        :config="config"
        :command-dispatcher="commandDispatcher"
      />
    </section>

    <template v-if="supportsDataBinding">
      <section class="property-group">
        <div class="section-heading">
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
          :command-dispatcher="commandDispatcher ?? dispatchCommand"
        />
      </section>

      <template v-if="selectedSource">
        <section class="property-group">
          <div class="section-heading">
            <div>
              <h3>字段映射</h3>
              <p>选择已有字段，或输入 path 路径后按回车创建</p>
            </div>
          </div>
          <CommonForm
            label-position="top"
            :model-value="selectedNode"
            :config="bindingConfig"
            :command-dispatcher="commandDispatcher ?? dispatchCommand"
          />
        </section>

        <section v-if="isApiSource" class="property-group">
          <div class="section-heading">
            <div>
              <h3>动态参数</h3>
              <p>表单项变化后自动重新请求</p>
            </div>
            <CommonButton
              size="small"
              type="normal"
              :disabled="!formItemOptions.length"
              @click="addDynamicParam"
            >
              添加参数
            </CommonButton>
          </div>

          <div v-if="dynamicParams.length" class="dynamic-param-list">
            <div v-for="param in dynamicParams" :key="param.id" class="dynamic-param-card">
              <button
                type="button"
                class="dynamic-param-remove icon-button"
                :aria-label="`删除参数 ${param.name}`"
                @click="removeDynamicParam(param.id)"
              >
                <Icon icon="fluent:delete-16-regular" width="15" />
              </button>
              <CommonForm
                label-position="top"
                :model-value="param"
                :config="dynamicParamConfig"
                :command-dispatcher="commandDispatcher ?? dispatchCommand"
              />
            </div>
            <CommonForm
              label-position="top"
              :model-value="selectedNode"
              :config="debounceConfig"
              :command-dispatcher="commandDispatcher ?? dispatchCommand"
            />
          </div>
          <div v-else class="dynamic-param-empty">
            {{
              formItemOptions.length
                ? '可将表单项值映射为接口请求参数'
                : '当前页面还没有可作为参数来源的表单项'
            }}
          </div>
        </section>

        <section class="property-group preview-group">
          <div class="section-heading">
            <div>
              <h3>数据预览</h3>
              <p>{{ previewRecordCount }} 条记录</p>
            </div>
            <button
              type="button"
              class="icon-action icon-button"
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
            <CommonTable :config="previewTableConfig" :data="previewRows" />
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

    <div v-else-if="!hasComponentData" class="empty-state unsupported-state">
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

.text-action {
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: var(--accent-color);
  cursor: pointer;
  font-size: 12px;
}

.icon-action {
  color: var(--accent-color);
}

.dynamic-param-list {
  display: grid;
  gap: 10px;
}

.dynamic-param-card {
  position: relative;
  padding: 10px 30px 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-raised);
}

.dynamic-param-remove {
  position: absolute;
  z-index: 1;
  top: 8px;
  right: 8px;
  color: var(--text-muted);
}

.dynamic-param-remove:hover {
  color: var(--el-color-danger);
}

.dynamic-param-empty {
  padding: 14px;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}

.preview-table-wrap {
  overflow: hidden;
  border-radius: 5px;

  :deep(.commonTable) {
    font-size: 12px;
  }

  :deep(.el-table__cell) {
    padding: 6px 0;
  }

  :deep(.el-table__header .cell) {
    font-weight: 500;
  }
}

.preview-state {
  display: flex;
  min-height: 88px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed var(--border-color);
  border-radius: 5px;
  color: var(--text-muted);
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
  padding: 24px;
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
