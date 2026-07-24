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
const { root } = storeToRefs(editorStore)
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()

const { config } = useConfigs<CommonFormConfig>(
  [
    {
      label: '宽度',
      field: 'placement.width',
      component: 'number',
      span: 12,
      props: { min: 1 },
    },
    {
      label: '高度',
      field: 'placement.height',
      component: 'number',
      span: 12,
      props: { min: 1 },
    },
    {
      label: '背景色',
      field: 'style.background.color',
      component: 'themeColor',
      span: 24,
    },
    {
      label: '背景图片',
      field: 'style.background.image.src',
      component: 'input',
      span: 24,
      props: {
        placeholder: '输入图片 URL',
      },
    },
    {
      label: '填充方式',
      field: 'style.background.image.fit',
      component: 'commonSelect',
      span: 12,
      props: {
        options: [
          { label: '覆盖', value: 'cover' },
          { label: '包含', value: 'contain' },
          { label: '拉伸', value: 'fill' },
          { label: '原始尺寸', value: 'auto' },
        ],
      },
    },
    {
      label: '重复方式',
      field: 'style.background.image.repeat',
      component: 'commonSelect',
      span: 12,
      props: {
        options: [
          { label: '不重复', value: 'no-repeat' },
          { label: '重复', value: 'repeat' },
          { label: '水平重复', value: 'repeat-x' },
          { label: '垂直重复', value: 'repeat-y' },
        ],
      },
    },
    {
      label: '图片位置',
      field: 'style.background.image.position',
      component: 'input',
      span: 12,
      props: {
        placeholder: 'center center',
      },
    },
    {
      label: '透明度',
      field: 'style.background.image.opacity',
      component: 'number',
      span: 12,
      props: {
        min: 0,
        max: 1,
        step: 0.05,
        precision: 2,
      },
    },
  ],
  false,
)

config.forEach((formItem) => {
  formItem.props = {
    ...formItem.props,
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
      <span class="canvas-icon icon-tile"
        ><Icon icon="fluent:slide-size-20-filled" width="18"
      /></span>
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
        :model-value="root"
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

.canvas-form {
  padding: 16px 14px;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
