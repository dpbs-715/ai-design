<script setup lang="ts">
import { ElMessage, type InputInstance } from 'element-plus'

defineOptions({ name: 'NodeNameEditor' })

const { name } = defineProps<{
  name: string
}>()

const emit = defineEmits<{
  rename: [name: string]
}>()

const isEditing = ref(false)
const nameDraft = ref('')
const nameInputRef = useTemplateRef<InputInstance>('nameInput')

async function beginEdit() {
  nameDraft.value = name
  isEditing.value = true
  await nextTick()
  nameInputRef.value?.focus()
  nameInputRef.value?.select()
}

function commitEdit() {
  if (!isEditing.value) return

  isEditing.value = false
  const nextName = nameDraft.value.trim()

  if (!nextName) {
    nameDraft.value = name
    ElMessage.warning('节点名称不能为空')
    return
  }
  if (nextName !== name) emit('rename', nextName)
}

function cancelEdit() {
  isEditing.value = false
  nameDraft.value = name
}

watch(
  () => name,
  (nextName) => {
    isEditing.value = false
    nameDraft.value = nextName
  },
)
</script>

<template>
  <span class="node-name-editor">
    <el-input
      v-if="isEditing"
      ref="nameInput"
      v-model="nameDraft"
      class="node-name-input"
      aria-label="节点名称"
      placeholder="节点名称"
      size="small"
      @blur="commitEdit"
      @keydown.enter.stop.prevent="commitEdit"
      @keydown.esc.stop.prevent="cancelEdit"
    />
    <template v-else>
      <strong>{{ name }}</strong>
      <el-tooltip content="编辑节点名称" placement="top" :show-after="350">
        <button
          type="button"
          class="node-name-edit icon-button icon-button--sm"
          aria-label="编辑节点名称"
          @click="beginEdit"
        >
          <Icon icon="fluent:edit-20-regular" width="14" />
        </button>
      </el-tooltip>
    </template>
  </span>
</template>

<style scoped lang="scss">
.node-name-editor {
  display: flex;
  min-width: 0;
  max-width: 190px;
  height: 24px;
  align-items: center;
  gap: 3px;

  strong {
    overflow: hidden;
    min-width: 0;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.node-name-edit {
  flex: none;
}

:deep(.node-name-input) {
  width: 100%;
  max-width: 180px;
}
</style>
