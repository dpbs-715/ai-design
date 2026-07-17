<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { type CommonFormConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import RenderThemeSection from '@/editor/panels/property/components/RenderThemeSection.vue'

defineOptions({
  name: 'CanvasProperty',
})

const editorStore = useEditorStore()
const { canvas } = storeToRefs(editorStore)
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()

const { config } = useConfigs<CommonFormConfig>(
  [
    {
      label: '宽度',
      field: 'width',
      component: 'number',
      span: 12,
    },
    {
      label: '高度',
      field: 'height',
      component: 'number',
      span: 12,
    },
    {
      label: '背景色',
      field: 'backgroundColor',
      component: 'themeColor',
      span: 24,
    },
  ],
  false,
)

config.forEach((config) => {
  config.props = {
    onFocus: () => {
      startBatch()
    },
    onBlur: () => {
      commitBatch()
    },
  }
})
</script>

<template>
  <div class="canvas-property">
    <header class="canvas-header">
      <span class="canvas-icon"><Icon icon="fluent:slide-size-20-filled" width="18" /></span>
      <span class="canvas-copy">
        <strong>画布</strong>
        <small>页面基础设置</small>
      </span>
    </header>
    <div class="content-heading">
      <h2>画布设置</h2>
      <span>尺寸与背景</span>
    </div>
    <div class="canvas-form">
      <CommonForm
        label-position="top"
        :command-dispatcher="dispatchCommand"
        v-model="canvas"
        :config="config"
      />
    </div>
    <RenderThemeSection />
  </div>
</template>

<style scoped lang="scss">
.canvas-property {
  height: 100%;
  overflow-y: auto;
  background: var(--surface-panel);
}

.canvas-header {
  display: flex;
  height: 54px;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
}

.canvas-icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 5px;
  background: var(--accent-soft);
  color: var(--accent-color);
}

.canvas-copy {
  display: flex;
  flex-direction: column;

  strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
  }

  small {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 11px;
  }
}

.content-heading {
  display: flex;
  height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid var(--border-color);

  h2 {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
  }

  span {
    color: var(--text-muted);
    font-size: 11px;
  }
}

.canvas-form {
  padding: 16px 14px;
}

:deep(.el-form-item__label) {
  margin-bottom: 5px;
  color: var(--text-muted);
  font-size: 12px;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
