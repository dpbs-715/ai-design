<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import DataSourceManager from './components/DataSourceManager.vue'
import { useRouter } from 'vue-router'
import { publishPage } from '@/utils/publish.ts'
import EditorThemeControl from '@/editor/theme/EditorThemeControl.vue'
import EditorAccentControl from '@/editor/theme/EditorAccentControl.vue'

defineOptions({ name: 'ToolbarRight' })

interface DataSourceManagerExpose {
  save: () => boolean | void
}

const uploadRef = useTemplateRef<HTMLInputElement>('inputRef')
const dataSourceManagerRef = useTemplateRef<DataSourceManagerExpose>('dataSourceManager')

const router = useRouter()

const editorStore = useEditorStore()
const { page } = storeToRefs(editorStore)

const visible = ref(false)
const jsonText = ref('')

const dataSourceVisible = ref(false)

function previewJson() {
  jsonText.value = JSON.stringify(page.value, null, 2)
  visible.value = true
}

function closeJsonEditor() {
  visible.value = false
}

function onConfirm() {
  const newPage = JSON.parse(jsonText.value)
  editorStore.setPage(newPage)
  visible.value = false
}

function onImport() {
  uploadRef.value.click()
}

async function onFileChange(e) {
  const file: File = e.target.files[0]
  if (!file) return
  const text = await file.text()
  try {
    const newPage = JSON.parse(text)
    editorStore.setPage(newPage)
    ElMessage.success('导入成功')
  } catch {
    ElMessage.error('请检查 JSON 是否合法')
  }
}

function onExport() {
  const json = JSON.stringify(page.value, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset-utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'design.json'
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
  router.push({
    name: 'ScreenPreview',
  })
}

function onPublish() {
  const id = publishPage(page.value)

  router.push({ name: 'Screen', query: { id } })
}

type MoreAction = 'json' | 'import' | 'export'

const moreActionHandlers: Record<MoreAction, () => void> = {
  json: previewJson,
  import: onImport,
  export: onExport,
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
      </template>
    </el-dropdown>

    <el-divider direction="vertical" />

    <button type="button" class="toolbar-action" aria-label="预览" @click="onPreview">
      <Icon icon="mdi:eye-outline" width="16" />
      <span>预览</span>
    </button>
    <button
      type="button"
      class="toolbar-action publish-button"
      aria-label="发布"
      @click="onPublish"
    >
      <Icon icon="mdi:cloud-upload-outline" width="16" />
      <span>发布</span>
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
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  gap: 4px;
}
</style>
