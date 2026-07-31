<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import DataSourceManager from './components/DataSourceManager.vue'
import { useRouter } from 'vue-router'
import {
  formatSchemaValidationIssue,
  parsePageSchema,
  parsePublicModuleSchema,
} from '@/schema/validation.ts'
import { useWorkspaceStore } from '@/workspace/store.ts'
import { getEditorShortcutLabels } from '@/editor/shortcuts.ts'
import { useEventListener } from '@vunio/hooks'
import {
  fromModuleEditorPage,
  getNextPublicModuleVersion,
  isSamePublicModuleContent,
  toModuleEditorPage,
  type PublicModuleSchema,
} from '@/schema/module.ts'
import type { PageSchema } from '@/schema/page.ts'
import ModuleRemovalDialog from '@/workspace/components/ModuleRemovalDialog.vue'
import type { PublicModuleRecord } from '@ai-design/contracts/workspace'

defineOptions({ name: 'ToolbarRight' })

interface DataSourceManagerExpose {
  save: () => boolean | void
}

const uploadRef = useTemplateRef<HTMLInputElement>('inputRef')
const dataSourceManagerRef = useTemplateRef<DataSourceManagerExpose>('dataSourceManager')

const router = useRouter()

const editorStore = useEditorStore()
const workspaceStore = useWorkspaceStore()
const { page } = storeToRefs(editorStore)
const shortcutLabels = getEditorShortcutLabels()

const visible = ref(false)
const jsonText = ref('')

const dataSourceVisible = ref(false)
const moduleRemovalVisible = ref(false)
const savePending = ref(false)

const currentModuleRecord = computed(() =>
  workspaceStore.modules.find((publicModule) => publicModule.id === page.value.id),
)

function getCurrentModuleRecord() {
  return currentModuleRecord.value
}

const editorModuleSchema = computed(() => {
  const moduleRecord = currentModuleRecord.value
  return moduleRecord ? fromModuleEditorPage(page.value, moduleRecord.schema) : undefined
})

const latestPublishedModuleVersion = computed(() => {
  const moduleRecord = currentModuleRecord.value
  if (!moduleRecord) return undefined
  return (
    moduleRecord.versions.find((version) => version.version === moduleRecord.version) ??
    moduleRecord.versions.at(-1)
  )
})

type ModuleSyncState =
  | { kind: 'unsaved'; label: '未保存'; title: string }
  | { kind: 'publish-needed'; label: string; title: string }
  | { kind: 'current'; label: string; title: string }

const moduleSyncState = computed<ModuleSyncState | undefined>(() => {
  const moduleRecord = currentModuleRecord.value
  const editorSchema = editorModuleSchema.value
  if (!moduleRecord || !editorSchema) return undefined

  if (!isSamePublicModuleContent(editorSchema, moduleRecord.schema)) {
    return {
      kind: 'unsaved',
      label: '未保存',
      title: '编辑内容尚未保存为模块草稿',
    }
  }

  const publishedVersion = latestPublishedModuleVersion.value
  if (
    !publishedVersion ||
    !isSamePublicModuleContent(moduleRecord.schema, publishedVersion.schema)
  ) {
    return {
      kind: 'publish-needed',
      label: publishedVersion ? '待发布' : '待首次发布',
      title: publishedVersion
        ? `草稿与 ${publishedVersion.version} 不一致，可以发布新版本`
        : '草稿尚未发布过，可以发布首个版本',
    }
  }

  return {
    kind: 'current',
    label: `已是 ${publishedVersion.version}`,
    title: `当前草稿与 ${publishedVersion.version} 内容一致，无需重复发布`,
  }
})

const isModuleSaveUnavailable = computed(
  () => moduleSyncState.value !== undefined && moduleSyncState.value.kind !== 'unsaved',
)
const isModulePublishUnavailable = computed(
  () => moduleSyncState.value !== undefined && moduleSyncState.value.kind !== 'publish-needed',
)
const saveButtonTitle = computed(() =>
  isModuleSaveUnavailable.value
    ? '当前模块没有未保存修改，点击可查看状态'
    : `保存 (${shortcutLabels.save})`,
)
const publishButtonTitle = computed(() => moduleSyncState.value?.title ?? '')
const saveButtonLabel = computed(() =>
  moduleSyncState.value && moduleSyncState.value.kind !== 'unsaved' ? '已保存' : '保存',
)
const nextModuleVersion = computed(() =>
  currentModuleRecord.value
    ? getNextPublicModuleVersion(currentModuleRecord.value.versions)
    : undefined,
)
const publishButtonLabel = computed(() => {
  const syncState = moduleSyncState.value
  if (!syncState) return '发布'
  if (syncState.kind === 'unsaved') return '先保存'
  if (syncState.kind === 'publish-needed') return `发布 ${nextModuleVersion.value}`
  return syncState.label
})

function getEditorExportValue(editorPage = page.value): PageSchema | PublicModuleSchema {
  const moduleRecord = getCurrentModuleRecord()
  return moduleRecord ? fromModuleEditorPage(editorPage, moduleRecord.schema) : editorPage
}

function setEditorJsonValue(value: unknown) {
  const moduleRecord = getCurrentModuleRecord()
  if (moduleRecord && typeof value === 'object' && value !== null && 'moduleId' in value) {
    const moduleResult = parsePublicModuleSchema(value)
    if (moduleResult.success === false) return moduleResult
    if (moduleResult.data.moduleId !== moduleRecord.id) {
      return {
        success: false as const,
        issues: [
          {
            path: ['moduleId'],
            message: '导入模块与当前模块 id 不一致',
          },
        ],
      }
    }
    return editorStore.setPage(toModuleEditorPage(moduleResult.data))
  }
  return editorStore.setPage(value)
}

function previewJson() {
  jsonText.value = JSON.stringify(getEditorExportValue(), null, 2)
  visible.value = true
}

function closeJsonEditor() {
  visible.value = false
}

function onConfirm() {
  try {
    const newPage = JSON.parse(jsonText.value)
    const result = setEditorJsonValue(newPage)
    if (result.success === false) {
      ElMessage.error(formatSchemaValidationIssue(result.issues[0]))
      return
    }
    visible.value = false
  } catch {
    ElMessage.error('JSON 格式不合法')
  }
}

function onImport() {
  uploadRef.value.click()
}

async function onFileChange(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const newPage = JSON.parse(text)
    const result = setEditorJsonValue(newPage)
    if (result.success === false) {
      ElMessage.error(formatSchemaValidationIssue(result.issues[0]))
      return
    }
    ElMessage.success('导入成功')
  } catch {
    ElMessage.error('JSON 格式不合法')
  } finally {
    input.value = ''
  }
}

function onExport() {
  const result = parsePageSchema(page.value)
  if (result.success === false) {
    ElMessage.error(formatSchemaValidationIssue(result.issues[0]))
    return
  }

  const exportValue = getEditorExportValue(result.data)
  const moduleResult =
    exportValue === result.data ? undefined : parsePublicModuleSchema(exportValue)
  if (moduleResult?.success === false) {
    ElMessage.error(formatSchemaValidationIssue(moduleResult.issues[0]))
    return
  }

  const json = JSON.stringify(moduleResult?.data ?? result.data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset-utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = moduleResult ? 'public-module.json' : 'design.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function openDataSource() {
  dataSourceVisible.value = true
}

function closeDataSource() {
  dataSourceVisible.value = false
}

function onSave() {
  const saved = dataSourceManagerRef.value?.save()
  if (saved !== false) dataSourceVisible.value = false
}

function onPreview() {
  const result = parsePageSchema(page.value)
  if (result.success === false) {
    ElMessage.error(formatSchemaValidationIssue(result.issues[0]))
    return
  }

  router.push({
    name: 'ScreenPreview',
  })
}

interface SaveEditorSchemaOptions {
  notify?: boolean
}

async function saveEditorSchema({ notify = true }: SaveEditorSchemaOptions = {}) {
  if (savePending.value) return
  savePending.value = true
  try {
    const result = parsePageSchema(page.value)
    if (result.success === false) {
      ElMessage.error(formatSchemaValidationIssue(result.issues[0]))
      return
    }

    const pageRecord = workspaceStore.getPage(result.data.id)
    if (pageRecord) {
      try {
        await workspaceStore.savePageSchema(pageRecord.id, result.data)
        if (notify) ElMessage.success('页面已保存')
        return { kind: 'page' as const, id: pageRecord.id }
      } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '页面保存失败')
        return
      }
    }

    const moduleRecord = workspaceStore.modules.find(
      (publicModule) => publicModule.id === result.data.id,
    )
    if (moduleRecord) {
      if (moduleSyncState.value?.kind !== 'unsaved') {
        if (notify) ElMessage.info('当前模块没有未保存修改')
        return { kind: 'module' as const, id: moduleRecord.id }
      }

      const moduleResult = parsePublicModuleSchema(
        fromModuleEditorPage(result.data, moduleRecord.schema),
      )
      if (moduleResult.success === false) {
        ElMessage.error(formatSchemaValidationIssue(moduleResult.issues[0]))
        return
      }
      try {
        await workspaceStore.saveModuleSchema(moduleRecord.id, moduleResult.data)
        if (notify) ElMessage.success('模块草稿已保存')
        return { kind: 'module' as const, id: moduleRecord.id }
      } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '模块草稿保存失败')
        return
      }
    }

    ElMessage.error('当前内容不属于工作空间，无法保存')
  } finally {
    savePending.value = false
  }
}

function hasOpenModal() {
  return Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).some(
    (dialog) => dialog.getClientRects().length > 0,
  )
}

function onSaveShortcut(event: KeyboardEvent) {
  const primaryModifier = event.metaKey || event.ctrlKey
  if (
    event.key.toLowerCase() !== 's' ||
    !primaryModifier ||
    event.altKey ||
    event.shiftKey ||
    event.isComposing
  ) {
    return
  }

  event.preventDefault()
  if (event.repeat || hasOpenModal()) return
  void saveEditorSchema()
}

useEventListener('keydown', onSaveShortcut)

async function onPublish() {
  const moduleRecord = currentModuleRecord.value
  if (!moduleRecord) {
    ElMessage.error('当前公共模块不存在，无法发布')
    return
  }

  if (moduleSyncState.value?.kind === 'unsaved') {
    ElMessage.warning('请先保存模块草稿，再发布版本')
    return
  }

  if (moduleSyncState.value?.kind === 'current') {
    ElMessage.info(`当前内容已是 ${latestPublishedModuleVersion.value?.version}，无需重复发布`)
    return
  }

  try {
    const publishResult = await workspaceStore.publishModuleSchema(moduleRecord.id)
    if (publishResult?.status === 'published') {
      ElMessage.success(`公共模块已发布为 ${publishResult.version}`)
    } else if (publishResult?.status === 'unchanged') {
      ElMessage.info(`当前内容已是 ${publishResult.version}，无需重复发布`)
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '公共模块发布失败')
  }
}

function openModuleRemoval() {
  if (currentModuleRecord.value) moduleRemovalVisible.value = true
}

function onModuleRemoved(publicModule: PublicModuleRecord) {
  void router.replace(`/projects/${publicModule.projectId}/modules`)
}

type MoreAction = 'json' | 'import' | 'export' | 'remove-module'

const moreActionHandlers: Record<MoreAction, () => void> = {
  json: previewJson,
  import: onImport,
  export: onExport,
  'remove-module': openModuleRemoval,
}

function onMoreAction(action: MoreAction) {
  moreActionHandlers[action]()
}
</script>

<template>
  <div class="toolbar flex items-center justify-end">
    <button type="button" class="toolbar-action" aria-label="打开数据源" @click="openDataSource">
      <Icon icon="mdi:database-cog-outline" width="16" />
      <span>数据源</span>
    </button>

    <el-dropdown trigger="click" @command="onMoreAction">
      <button type="button" class="toolbar-action" aria-label="更多配置操作">
        <Icon icon="mdi:dots-horizontal" width="16" />
        <span>更多</span>
      </button>
      <template #dropdown>
        <el-dropdown-item command="json">
          <Icon class="mr-8" icon="mdi:code-json" width="16" />
          编辑 JSON
        </el-dropdown-item>
        <el-dropdown-item command="import">
          <Icon class="mr-8" icon="mdi:file-import-outline" width="16" />
          导入配置
        </el-dropdown-item>
        <el-dropdown-item command="export">
          <Icon class="mr-8" icon="mdi:file-export-outline" width="16" />
          导出配置
        </el-dropdown-item>
        <el-dropdown-item v-if="currentModuleRecord" divided command="remove-module">
          <Icon class="mr-8 danger-action" icon="mdi:delete-outline" width="16" />
          <span class="danger-action">删除模块</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>

    <el-divider direction="vertical" />

    <span
      v-if="moduleSyncState"
      class="module-sync-state"
      :data-state="moduleSyncState.kind"
      :title="moduleSyncState.title"
      aria-live="polite"
    >
      {{ moduleSyncState.label }}
    </span>
    <button
      type="button"
      class="toolbar-action save-button"
      :class="{
        'is-action-required': moduleSyncState?.kind === 'unsaved',
        'is-explained-disabled': isModuleSaveUnavailable,
      }"
      :aria-label="saveButtonLabel"
      :title="saveButtonTitle"
      @click="saveEditorSchema()"
    >
      <Icon icon="mdi:content-save-outline" width="16" />
      <span>{{ saveButtonLabel }}</span>
    </button>
    <button type="button" class="toolbar-action" aria-label="预览" @click="onPreview">
      <Icon icon="mdi:eye-outline" width="16" />
      <span>预览</span>
    </button>
    <button
      v-if="currentModuleRecord"
      type="button"
      class="toolbar-action publish-button"
      :class="{ 'is-explained-disabled': isModulePublishUnavailable }"
      :aria-label="publishButtonLabel"
      :title="publishButtonTitle"
      @click="onPublish"
    >
      <Icon icon="mdi:cloud-upload-outline" width="16" />
      <span>{{ publishButtonLabel }}</span>
    </button>

    <input ref="inputRef" type="file" v-show="false" @change="onFileChange" />

    <el-drawer destroy-on-close v-model="visible" title="编辑 JSON" size="800">
      <MonacoEditor v-model="jsonText" />
      <template #footer>
        <CommonButton class="mr-10" type="normal" @click="closeJsonEditor">取消</CommonButton>

        <CommonButton type="primary" @click="onConfirm">确认</CommonButton>
      </template>
    </el-drawer>

    <el-drawer v-model="dataSourceVisible" destroy-on-close title="管理数据源" :size="720">
      <DataSourceManager ref="dataSourceManager" />
      <template #footer>
        <CommonButton class="mr-10" type="normal" @click="closeDataSource"> 取消 </CommonButton>
        <CommonButton type="primary" @click="onSave">保存数据源</CommonButton>
      </template>
    </el-drawer>

    <ModuleRemovalDialog
      v-model="moduleRemovalVisible"
      :public-module="currentModuleRecord"
      @removed="onModuleRemoved"
    />
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  gap: 4px;
}

.module-sync-state {
  display: inline-flex;
  height: 22px;
  align-items: center;
  padding: 0 7px;
  border: 1px solid var(--border-color);
  border-radius: 99px;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;

  &[data-state='unsaved'] {
    border-color: color-mix(in srgb, var(--el-color-warning) 36%, var(--border-color));
    background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
    color: var(--el-color-warning);
  }

  &[data-state='publish-needed'] {
    border-color: color-mix(in srgb, var(--accent-color) 30%, var(--border-color));
    background: var(--accent-soft);
    color: var(--accent-color);
  }

  &[data-state='current'] {
    border-color: color-mix(in srgb, var(--el-color-success) 28%, var(--border-color));
    background: color-mix(in srgb, var(--el-color-success) 8%, transparent);
    color: var(--el-color-success);
  }
}

.save-button.is-action-required {
  border-color: color-mix(in srgb, var(--accent-color) 45%, var(--border-color));
  background: var(--accent-soft);
  color: var(--accent-color);
}

.toolbar-action.is-explained-disabled {
  border-color: var(--border-color);
  background: transparent;
  color: var(--text-muted);
  cursor: help;
  opacity: 0.72;

  &:hover {
    border-color: var(--border-color-strong);
    background: var(--surface-raised);
    color: var(--text-secondary);
  }
}

.danger-action {
  color: var(--el-color-danger);
}

@media (max-width: 1099px) {
  .module-sync-state {
    display: none;
  }
}
</style>
