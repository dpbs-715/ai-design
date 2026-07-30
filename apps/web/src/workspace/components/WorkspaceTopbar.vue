<script setup lang="ts">
import EditorAccentControl from '@/editor/theme/EditorAccentControl.vue'
import EditorThemeControl from '@/editor/theme/EditorThemeControl.vue'

defineOptions({ name: 'WorkspaceTopbar' })

defineProps<{
  compactBrand?: boolean
}>()
</script>

<template>
  <header class="workspace-topbar">
    <RouterLink class="brand" to="/" aria-label="返回主面板">
      <span class="brand-mark">
        <img src="/favicon.svg" alt="" />
      </span>
      <span v-if="!compactBrand" class="brand-copy">
        <strong>视界工场</strong>
        <small>VISUAL WORKS</small>
      </span>
    </RouterLink>

    <div class="topbar-context">
      <slot />
    </div>

    <div class="topbar-actions">
      <div class="appearance-tools" aria-label="系统外观设置">
        <EditorThemeControl />
        <EditorAccentControl />
      </div>

      <el-dropdown trigger="click" placement="bottom-end">
        <button type="button" class="account-trigger" aria-label="打开账户菜单">
          <span class="account-copy">
            <strong>林墨</strong>
            <small>设计管理员</small>
          </span>
          <span class="avatar">LM</span>
        </button>
        <template #dropdown>
          <el-dropdown-item>
            <Icon icon="fluent:person-20-regular" width="16" />
            账户设置
          </el-dropdown-item>
          <el-dropdown-item>
            <Icon icon="fluent:question-circle-20-regular" width="16" />
            使用帮助
          </el-dropdown-item>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.workspace-topbar {
  position: relative;
  z-index: 20;
  display: grid;
  height: 68px;
  flex: none;
  grid-template-columns: minmax(190px, 0.75fr) minmax(0, 1.4fr) minmax(270px, 0.75fr);
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--surface-panel) 92%, transparent);
  backdrop-filter: blur(18px) saturate(1.15);
}

.brand {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 11px;
  color: var(--text-primary);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  flex: none;
  width: 31px;
  height: 31px;
  place-items: center;

  img {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.brand-copy {
  display: flex;
  flex-direction: column;

  strong {
    font-size: 15px;
    font-weight: 650;
    letter-spacing: 0.08em;
  }

  small {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.2em;
  }
}

.topbar-context {
  min-width: 0;
}

.topbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
}

.appearance-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.account-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.account-copy {
  display: flex;
  align-items: flex-end;
  flex-direction: column;

  strong {
    font-size: 12px;
    font-weight: 600;
  }

  small {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 10px;
  }
}

.avatar {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--accent-color) 36%, var(--border-color));
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-color);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

:deep(.el-dropdown-menu__item) {
  gap: 8px;
}

@media (max-width: 820px) {
  .workspace-topbar {
    grid-template-columns: auto 1fr auto;
    padding: 0 14px;
  }

  .brand-copy,
  .account-copy,
  .appearance-tools {
    display: none;
  }
}
</style>
