<script setup lang="ts">
import type { PublicModuleRecord } from '@ai-design/contracts/workspace'
import DesignThumbnail from './DesignThumbnail.vue'
import { formatWorkspaceTime } from '../time.ts'

defineOptions({ name: 'PublicModuleCard' })

defineEmits<{
  duplicate: []
  rename: []
  remove: []
  references: []
}>()

const props = defineProps<{
  publicModule: PublicModuleRecord
}>()

const inputSummary = computed(() => {
  const labels = props.publicModule.schema.contract.inputs.map((input) => input.label)
  return labels.length ? labels.join(' · ') : '未声明输入'
})
const displayVersion = computed(() =>
  props.publicModule.versions.length ? props.publicModule.version : '未发布',
)
</script>

<template>
  <article class="module-card">
    <div class="module-frame">
      <RouterLink
        class="module-preview"
        :to="`/projects/${publicModule.projectId}/modules/${publicModule.id}/editor`"
        :aria-label="`编辑公共模块 ${publicModule.schema.root.name}`"
      >
        <DesignThumbnail :seed="publicModule.id" compact />
        <span class="module-crop crop-top"></span>
        <span class="module-crop crop-bottom"></span>
        <span class="module-badge">
          <Icon icon="fluent:puzzle-piece-20-filled" width="13" />
          公共模块
        </span>
        <span class="edit-overlay">
          <Icon icon="fluent:edit-20-filled" width="17" />
          编辑模块
        </span>
      </RouterLink>
    </div>

    <div class="module-body">
      <header class="module-heading">
        <div>
          <h3>{{ publicModule.schema.root.name }}</h3>
          <p>
            <span>{{ displayVersion }}</span>
            {{ inputSummary }}
          </p>
        </div>
        <el-dropdown trigger="click" placement="bottom-end">
          <button type="button" class="module-more" aria-label="公共模块更多操作">
            <Icon icon="fluent:more-horizontal-20-regular" width="18" />
          </button>
          <template #dropdown>
            <el-dropdown-item @click="$emit('references')">查看引用</el-dropdown-item>
            <el-dropdown-item @click="$emit('rename')">重命名</el-dropdown-item>
            <el-dropdown-item @click="$emit('duplicate')">复制模块</el-dropdown-item>
            <el-dropdown-item divided @click="$emit('remove')">删除模块</el-dropdown-item>
          </template>
        </el-dropdown>
      </header>

      <div class="module-meta">
        <button type="button" @click="$emit('references')">
          <Icon icon="fluent:link-20-regular" width="13" />
          被 {{ publicModule.referenceCount }} 个页面引用
        </button>
        <span>{{ formatWorkspaceTime(publicModule.updatedAt) }}</span>
      </div>

      <footer class="module-actions">
        <RouterLink :to="`/projects/${publicModule.projectId}/modules/${publicModule.id}/editor`">
          编辑模块
          <Icon icon="fluent:arrow-right-20-regular" width="14" />
        </RouterLink>
        <span>{{ displayVersion }}{{ publicModule.versions.length ? ' 当前版本' : '' }}</span>
      </footer>
    </div>
  </article>
</template>

<style scoped lang="scss">
.module-card {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent-color) 20%, var(--border-color));
  border-radius: 12px;
  background: var(--surface-panel);
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    border-color: color-mix(in srgb, var(--accent-color) 48%, var(--border-color));
    box-shadow: 0 12px 28px rgb(0 0 0 / 9%);
    transform: translateY(-3px);
  }
}

.module-frame {
  padding: 10px;
  border-bottom: 1px dashed color-mix(in srgb, var(--accent-color) 28%, var(--border-color));
  background: linear-gradient(135deg, var(--accent-soft), transparent 58%), var(--surface-raised);
}

.module-preview {
  position: relative;
  display: block;
  aspect-ratio: 16 / 8.4;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent-color) 28%, var(--border-color));
  border-radius: 8px;
}

.module-crop {
  position: absolute;
  right: 8px;
  width: 18px;
  height: 18px;
  border-right: 1px solid rgb(255 255 255 / 32%);
}

.crop-top {
  top: 8px;
  border-top: 1px solid rgb(255 255 255 / 32%);
}

.crop-bottom {
  bottom: 8px;
  border-bottom: 1px solid rgb(255 255 255 / 32%);
}

.module-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: 5px;
  background: rgb(11 16 23 / 68%);
  color: rgb(244 247 250 / 82%);
  font-size: 9px;
  backdrop-filter: blur(8px);
}

.edit-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: rgb(8 12 18 / 52%);
  color: #fff;
  font-size: 11px;
  opacity: 0;
  transition: opacity 150ms ease;
}

.module-preview:hover .edit-overlay {
  opacity: 1;
}

.module-body {
  padding: 14px;
}

.module-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0;
    overflow: hidden;
    color: var(--text-muted);
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;

    span {
      margin-right: 6px;
      color: var(--accent-color);
      font-weight: 700;
    }
  }
}

.module-more {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }
}

.module-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 13px;
  color: var(--text-muted);
  font-size: 9px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;

    &:hover {
      color: var(--accent-color);
    }
  }
}

.module-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px -14px -14px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--accent-soft) 42%, transparent);

  a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--accent-color);
    font-size: 10px;
    font-weight: 550;
    text-decoration: none;
  }

  span {
    color: var(--text-muted);
    font-size: 9px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .module-card,
  .edit-overlay {
    transition: none;
  }
}
</style>
