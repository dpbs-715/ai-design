<script setup lang="ts">
import type { ProjectPageRecord } from '../types.ts'
import DesignThumbnail from './DesignThumbnail.vue'

defineOptions({ name: 'ProjectPageCard' })

defineProps<{
  page: ProjectPageRecord
}>()

defineEmits<{
  duplicate: []
  rename: []
  remove: []
}>()
</script>

<template>
  <article class="asset-card page-card">
    <RouterLink
      class="asset-preview"
      :to="`/projects/${page.projectId}/pages/${page.id}/editor`"
      :aria-label="`编辑页面 ${page.name}`"
    >
      <DesignThumbnail :variant="page.thumbnailVariant" compact />
      <span class="asset-kind">页面</span>
      <span class="edit-overlay">
        <Icon icon="fluent:edit-20-filled" width="17" />
        编辑页面
      </span>
    </RouterLink>

    <div class="asset-body">
      <header class="asset-heading">
        <div>
          <h3>{{ page.name }}</h3>
          <p>{{ page.width }} × {{ page.height }}</p>
        </div>
        <el-dropdown trigger="click" placement="bottom-end">
          <button type="button" class="asset-more" aria-label="页面更多操作">
            <Icon icon="fluent:more-horizontal-20-regular" width="18" />
          </button>
          <template #dropdown>
            <el-dropdown-item @click="$emit('rename')">重命名</el-dropdown-item>
            <el-dropdown-item @click="$emit('duplicate')">复制页面</el-dropdown-item>
            <el-dropdown-item divided @click="$emit('remove')">删除页面</el-dropdown-item>
          </template>
        </el-dropdown>
      </header>

      <div class="asset-meta">
        <span>
          <Icon icon="fluent:puzzle-piece-20-regular" width="13" />
          {{ page.moduleReferenceCount }} 个公共模块
        </span>
        <span>{{ page.updatedAt }}</span>
      </div>

      <footer class="asset-actions">
        <RouterLink :to="`/projects/${page.projectId}/pages/${page.id}/editor`">
          编辑页面
        </RouterLink>
        <RouterLink :to="{ name: 'ScreenPreview' }">
          <Icon icon="fluent:eye-20-regular" width="14" />
          预览
        </RouterLink>
      </footer>
    </div>
  </article>
</template>

<style scoped lang="scss">
.asset-card {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--surface-panel);
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    border-color: color-mix(in srgb, var(--accent-color) 32%, var(--border-color));
    box-shadow: 0 12px 28px rgb(0 0 0 / 9%);
    transform: translateY(-3px);
  }
}

.asset-preview {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-bottom: 1px solid var(--border-color);
}

.asset-kind {
  position: absolute;
  top: 9px;
  left: 9px;
  padding: 4px 7px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 5px;
  background: rgb(11 16 23 / 64%);
  color: rgb(245 247 250 / 76%);
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
  backdrop-filter: blur(2px);
}

.asset-preview:hover .edit-overlay {
  opacity: 1;
}

.asset-body {
  padding: 14px;
}

.asset-heading {
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
    margin: 5px 0 0;
    color: var(--text-muted);
    font-size: 10px;
  }
}

.asset-more {
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

.asset-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 13px;
  color: var(--text-muted);
  font-size: 9px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
}

.asset-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px -14px -14px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--surface-raised) 52%, transparent);

  a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-secondary);
    font-size: 10px;
    font-weight: 550;
    text-decoration: none;

    &:first-child {
      color: var(--accent-color);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .asset-card,
  .edit-overlay {
    transition: none;
  }
}
</style>
