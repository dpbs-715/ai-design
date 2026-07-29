<script setup lang="ts">
import { useWorkspaceStore } from '@/workspace/store.ts'
import type { PublicModuleRecord } from '@/workspace/types.ts'

defineOptions({ name: 'ModuleRemovalDialog' })

const { publicModule } = defineProps<{
  publicModule?: PublicModuleRecord
}>()
const emit = defineEmits<{
  removed: [publicModule: PublicModuleRecord]
}>()
const visible = defineModel<boolean>({ default: false })
const workspaceStore = useWorkspaceStore()

const referencePages = computed(() =>
  publicModule ? workspaceStore.getModuleReferences(publicModule.id) : [],
)
const isReferenced = computed(() => referencePages.value.length > 0)
const publishedVersionCount = computed(() => publicModule?.versions.length ?? 0)

function close() {
  visible.value = false
}

function removeModule() {
  if (!publicModule || isReferenced.value) return
  const result = workspaceStore.removeModule(publicModule.id)
  if (result.status !== 'removed') return
  close()
  emit('removed', publicModule)
}
</script>

<template>
  <CommonDialog
    v-model="visible"
    destroy-on-close
    footer-hide
    width="480px"
    :close-on-click-modal="false"
    :title="isReferenced ? '暂时无法删除模块' : '永久删除公共模块'"
  >
    <template v-if="publicModule">
      <div v-if="isReferenced" class="removal-message is-blocked">
        <span class="removal-icon">
          <Icon icon="fluent:link-dismiss-20-filled" width="22" />
        </span>
        <div>
          <strong>先解除 {{ referencePages.length }} 个页面中的模块引用</strong>
          <p>直接删除会导致页面无法渲染这个模块，因此当前操作已被阻止。</p>
        </div>
      </div>
      <div v-else class="removal-message is-danger">
        <span class="removal-icon">
          <Icon icon="fluent:delete-20-filled" width="22" />
        </span>
        <div>
          <strong>删除“{{ publicModule.schema.root.name }}”后无法恢复</strong>
          <p v-if="publishedVersionCount">
            将同时删除当前草稿和 {{ publishedVersionCount }} 个已发布版本。
          </p>
          <p v-else>将删除当前草稿。</p>
        </div>
      </div>

      <div v-if="isReferenced" class="reference-pages">
        <RouterLink
          v-for="page in referencePages"
          :key="page.id"
          :to="`/projects/${page.projectId}/pages/${page.id}/editor`"
        >
          <span>
            <Icon icon="fluent:window-20-regular" width="15" />
            {{ page.schema.root.name }}
          </span>
          <Icon icon="fluent:open-16-regular" width="14" />
        </RouterLink>
      </div>
    </template>

    <template #footer>
      <CommonButton type="normal" @click="close">
        {{ isReferenced ? '知道了' : '取消' }}
      </CommonButton>
      <CommonButton v-if="!isReferenced" type="danger" @click="removeModule">
        永久删除
      </CommonButton>
    </template>
  </CommonDialog>
</template>

<style scoped lang="scss">
.removal-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;

  .removal-icon {
    display: grid;
    width: 36px;
    height: 36px;
    flex: none;
    place-items: center;
    border-radius: 8px;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.65;
  }

  &.is-blocked {
    border-color: color-mix(in srgb, var(--el-color-warning) 30%, var(--border-color));
    background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);

    .removal-icon {
      background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
      color: var(--el-color-warning);
    }
  }

  &.is-danger {
    border-color: color-mix(in srgb, var(--el-color-danger) 28%, var(--border-color));
    background: color-mix(in srgb, var(--el-color-danger) 7%, transparent);

    .removal-icon {
      background: color-mix(in srgb, var(--el-color-danger) 13%, transparent);
      color: var(--el-color-danger);
    }
  }
}

.reference-pages {
  display: grid;
  max-height: 220px;
  gap: 6px;
  margin-top: 12px;
  overflow-y: auto;

  a {
    display: flex;
    min-height: 38px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 11px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 11px;
    transition:
      border-color 140ms ease,
      background-color 140ms ease,
      color 140ms ease;

    &:hover {
      border-color: var(--accent-color);
      background: var(--accent-soft);
      color: var(--accent-color);
    }

    span {
      display: inline-flex;
      min-width: 0;
      align-items: center;
      gap: 8px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .reference-pages a {
    transition: none;
  }
}
</style>
