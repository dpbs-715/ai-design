<script setup lang="ts">
import type { TrashItem, TrashResourceType } from '@ai-design/contracts/workspace'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'

import { useWorkspaceStore } from '../store.ts'

defineOptions({ name: 'WorkspaceTrashDialog' })

const visible = defineModel<boolean>({ default: false })
const workspaceStore = useWorkspaceStore()
const { trashItems, trashRetentionDays } = storeToRefs(workspaceStore)
const loading = ref(false)
const pendingItemId = ref('')

const typeDetails: Record<TrashResourceType, { label: string; icon: string }> = {
  project: { label: '项目', icon: 'fluent:folder-20-regular' },
  page: { label: '页面', icon: 'fluent:window-20-regular' },
  'public-module': { label: '公共模块', icon: 'fluent:puzzle-piece-20-regular' },
}

watch(visible, async (isVisible) => {
  if (!isVisible) return
  loading.value = true
  try {
    await workspaceStore.loadTrash()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '垃圾桶加载失败')
  } finally {
    loading.value = false
  }
})

function remainingDays(item: TrashItem) {
  return Math.max(0, Math.ceil(dayjs(item.expiresAt).diff(dayjs(), 'hour', true) / 24))
}

async function restore(item: TrashItem) {
  pendingItemId.value = item.id
  try {
    const result = await workspaceStore.restoreTrashItem(item)
    if (result.synchronized) {
      ElMessage.success(`“${item.name}”已恢复`)
    } else {
      ElMessage.warning(`“${item.name}”已恢复，但列表刷新失败，请稍后刷新页面`)
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '资源恢复失败')
  } finally {
    pendingItemId.value = ''
  }
}

async function permanentlyDelete(item: TrashItem) {
  try {
    await ElMessageBox.confirm(`“${item.name}”及其包含的数据将无法恢复。`, '确认永久删除', {
      type: 'error',
      confirmButtonText: '永久删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  pendingItemId.value = item.id
  try {
    const result = await workspaceStore.permanentlyDeleteTrashItem(item)
    if (result.synchronized) {
      ElMessage.success(`“${item.name}”已永久删除`)
    } else {
      ElMessage.warning(`“${item.name}”已永久删除，但引用计数刷新失败`)
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '永久删除失败')
  } finally {
    pendingItemId.value = ''
  }
}
</script>

<template>
  <CommonDialog v-model="visible" destroy-on-close footer-hide width="680px" title="垃圾桶">
    <p v-if="trashRetentionDays" class="trash-note">
      资源将在进入垃圾桶 {{ trashRetentionDays }} 天后自动永久删除，也可以立即恢复或删除。
    </p>

    <div v-loading="loading" class="trash-list">
      <div v-for="item in trashItems" :key="`${item.type}:${item.id}`" class="trash-item">
        <span class="trash-item__icon">
          <Icon :icon="typeDetails[item.type].icon" width="19" />
        </span>
        <div class="trash-item__content">
          <strong>{{ item.name }}</strong>
          <span>
            {{ typeDetails[item.type].label }}
            <template v-if="item.projectName"> · {{ item.projectName }}</template>
            · {{ remainingDays(item) }} 天后自动删除
          </span>
        </div>
        <div class="trash-item__actions">
          <CommonButton
            size="small"
            type="normal"
            :disabled="Boolean(pendingItemId)"
            @click="restore(item)"
          >
            恢复
          </CommonButton>
          <CommonButton
            size="small"
            type="danger"
            :disabled="Boolean(pendingItemId)"
            @click="permanentlyDelete(item)"
          >
            永久删除
          </CommonButton>
        </div>
      </div>

      <div v-if="!loading && !trashItems.length" class="trash-empty">
        <Icon icon="fluent:delete-dismiss-20-regular" width="28" />
        <strong>垃圾桶是空的</strong>
        <span>删除的项目、页面和公共模块会暂时保存在这里。</span>
      </div>
    </div>
  </CommonDialog>
</template>

<style scoped lang="scss">
.trash-note {
  margin: 0 0 14px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;
}

.trash-list {
  min-height: 220px;
  max-height: min(520px, 62vh);
  overflow-y: auto;
}

.trash-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--border-color);
}

.trash-item__icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: none;
  place-items: center;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--surface-raised);
  color: var(--text-secondary);
}

.trash-item__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    margin-top: 5px;
    color: var(--text-muted);
    font-size: 10px;
  }
}

.trash-item__actions {
  display: flex;
  flex: none;
  gap: 7px;
}

.trash-empty {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--text-muted);

  strong {
    margin-top: 12px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  span {
    margin-top: 6px;
    font-size: 10px;
  }
}

@media (max-width: 640px) {
  .trash-item {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .trash-item__content {
    width: calc(100% - 54px);
    flex: none;
  }

  .trash-item__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
