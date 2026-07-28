<script setup lang="ts">
import type { DesignProject } from '../types.ts'
import DesignThumbnail from './DesignThumbnail.vue'

defineOptions({ name: 'ProjectStackCard' })

defineProps<{
  project: DesignProject
}>()
</script>

<template>
  <article class="project-card">
    <RouterLink
      class="project-stack"
      :to="`/projects/${project.id}/pages`"
      :aria-label="`进入项目 ${project.name}`"
    >
      <span class="stack-sheet sheet-back"></span>
      <span class="stack-sheet sheet-middle"></span>
      <span class="stack-sheet sheet-near"></span>
      <span class="stack-sheet sheet-main">
        <DesignThumbnail :variant="project.thumbnailVariant" />
        <span class="preview-label">
          <Icon icon="fluent:window-multiple-20-regular" width="13" />
          {{ project.pageIds.length }} 个页面
        </span>
      </span>
    </RouterLink>

    <div class="project-info">
      <div class="project-heading">
        <div>
          <h2>{{ project.name }}</h2>
          <p>{{ project.description }}</p>
        </div>
        <el-dropdown trigger="click" placement="bottom-end">
          <button type="button" class="project-more" aria-label="项目更多操作">
            <Icon icon="fluent:more-horizontal-20-regular" width="18" />
          </button>
          <template #dropdown>
            <el-dropdown-item>重命名项目</el-dropdown-item>
            <el-dropdown-item>复制项目</el-dropdown-item>
            <el-dropdown-item>项目设置</el-dropdown-item>
          </template>
        </el-dropdown>
      </div>

      <div class="project-meta">
        <span>{{ project.pageIds.length }} 页面</span>
        <i></i>
        <span>{{ project.moduleIds.length }} 模块</span>
        <i></i>
        <span>{{ project.updatedAt }}</span>
      </div>

      <div class="project-actions">
        <RouterLink class="enter-link" :to="`/projects/${project.id}/pages`">
          进入项目
          <Icon icon="fluent:arrow-right-20-regular" width="15" />
        </RouterLink>
        <RouterLink
          v-if="project.lastEditedPageId"
          class="continue-link"
          :to="`/projects/${project.id}/pages/${project.lastEditedPageId}/editor`"
        >
          继续编辑
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.project-card {
  min-width: 0;
}

.project-stack {
  position: relative;
  display: block;
  width: calc(100% - 20px);
  aspect-ratio: 1.48;
  margin: 14px 10px 24px;
  color: inherit;
  text-decoration: none;
}

.stack-sheet {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border-color-strong) 72%, transparent);
  border-radius: 14px;
  box-shadow: 0 7px 18px color-mix(in srgb, #080b10 11%, transparent);
  transform-origin: 50% 85%;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 220ms ease;
}

.sheet-back {
  background: color-mix(in srgb, var(--accent-color) 15%, var(--surface-panel));
  transform: translate(-8px, 3px) rotate(-4.2deg);
}

.sheet-middle {
  background: color-mix(in srgb, #87a797 24%, var(--surface-panel));
  transform: translate(8px, 5px) rotate(3.8deg);
}

.sheet-near {
  background: color-mix(in srgb, #b99b7d 20%, var(--surface-panel));
  transform: translate(-2px, 2px) rotate(-1.7deg);
}

.sheet-main {
  background: var(--surface-panel);
}

.project-stack:hover {
  .sheet-back {
    transform: translate(-13px, 1px) rotate(-6deg);
  }

  .sheet-middle {
    transform: translate(14px, 3px) rotate(5.5deg);
  }

  .sheet-near {
    transform: translate(-3px, -2px) rotate(-2.4deg);
  }

  .sheet-main {
    box-shadow: 0 14px 28px color-mix(in srgb, #080b10 16%, transparent);
    transform: translateY(-7px);
  }
}

.preview-label {
  position: absolute;
  right: 10px;
  bottom: 9px;
  display: inline-flex;
  height: 24px;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 99px;
  background: rgb(11 16 23 / 68%);
  color: rgb(240 244 248 / 82%);
  font-size: 9px;
  backdrop-filter: blur(10px);
}

.project-info {
  padding: 0 5px;
}

.project-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  p {
    margin: 6px 0 0;
    overflow: hidden;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.55;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.project-more {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 10px;

  i {
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: var(--border-color-strong);
  }
}

.project-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 15px;
}

.enter-link,
.continue-link {
  display: inline-flex;
  height: 30px;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 550;
  text-decoration: none;
}

.enter-link {
  color: var(--accent-color);
}

.continue-link {
  padding-left: 14px;
  border-left: 1px solid var(--border-color);

  &:hover {
    color: var(--text-primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stack-sheet {
    transition: none;
  }

  .project-stack:hover .stack-sheet {
    transform: revert-layer;
  }
}
</style>
