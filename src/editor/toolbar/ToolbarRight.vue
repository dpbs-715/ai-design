<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import DataSourceManager from './components/DataSourceManager.vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'ToolbarRight' })

const uploadRef = useTemplateRef<HTMLInputElement>('inputRef')
const dataSourceManagerRef = useTemplateRef('dataSourceManager')

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

function onSave() {
  dataSourceManagerRef.value.save()
  dataSourceVisible.value = false
}

function onPreview() {
  router.push({
    name: 'ScreenPreview',
  })
}
</script>

<template>
  <div class="flex gap-20 toolbar-right justify-end">
    <span @click="onPreview">
      <Icon icon="fluent:preview-link-16-filled" />
    </span>
    <span @click="previewJson">
      <Icon icon="si:json-fill" />
    </span>
    <span>
      <Icon icon="entypo:publish" />
    </span>
    <span @click="openDataSource">
      <Icon icon="mdi:database" />
    </span>
    <span @click="onImport">
      <Icon icon="mdi:import" />
    </span>
    <span @click="onExport">
      <Icon icon="mdi:export" />
    </span>

    <input ref="inputRef" type="file" v-show="false" @change="onFileChange" />

    <el-drawer destroy-on-close v-model="visible" title="编辑 JSON" size="900">
      <MonacoEditor v-model="jsonText" />
      <template #footer>
        <CommonButton class="mr-10" type="normal" @click="visible = false">取消</CommonButton>

        <CommonButton type="primary" @click="onConfirm">确认</CommonButton>
      </template>
    </el-drawer>

    <CommonDialog
      destroy-on-close
      @confirm="onSave"
      title="数据源配置"
      v-model="dataSourceVisible"
      width="800"
    >
      <DataSourceManager ref="dataSourceManager" />
    </CommonDialog>
  </div>
</template>

<style scoped lang="scss">
.toolbar-right {
  span {
    padding: 4px;
    border: 1px solid #3b465b;
    border-radius: 3px;
    cursor: pointer;
  }
}
</style>
