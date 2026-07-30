<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { type CommonFormConfig } from '@vunio/ui'
import { useConfigs } from '@vunio/hooks'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import RenderThemeSection from '@/editor/panels/property/components/RenderThemeSection.vue'
import BackgroundPositionPicker from '@/editor/panels/property/components/BackgroundPositionPicker.vue'
import { markRaw } from 'vue'
import { useRoute } from 'vue-router'
import ModuleContractSection from './ModuleContractSection.vue'

defineOptions({
  name: 'CanvasProperty',
})

const editorStore = useEditorStore()
const route = useRoute()
const { root } = storeToRefs(editorStore)
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()
const isModuleEditor = computed(() => route.name === 'ProjectModuleEditor')

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
      label: '裁剪超出内容',
      field: 'props.clipContent',
      component: 'switch',
      span: 24,
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
      component: markRaw(BackgroundPositionPicker),
      span: 12,
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

const canvasConfig = computed(() =>
  isModuleEditor.value
    ? config
    : config.filter((formItem) => formItem.field !== 'props.clipContent'),
)
</script>

<template>
  <div class="canvas-property">
    <header class="canvas-header">
      <span class="canvas-icon icon-tile"
        ><Icon icon="fluent:slide-size-20-filled" width="18"
      /></span>
      <span class="canvas-copy">
        <strong>{{ isModuleEditor ? '模块画布' : '画布' }}</strong>
        <small>{{ isModuleEditor ? '模块边界与背景设置' : '页面基础设置' }}</small>
      </span>
    </header>
    <div class="content-heading">
      <h2>画布设置</h2>
      <span>{{ isModuleEditor ? '边界、裁剪与背景' : '尺寸与背景' }}</span>
    </div>
    <div class="canvas-form">
      <CommonForm
        label-position="top"
        :command-dispatcher="dispatchCommand"
        :model-value="root"
        :config="canvasConfig"
      />
      <p v-if="isModuleEditor" class="module-canvas-hint">
        模块边界只负责布局，默认透明且不裁剪；需要视觉容器时，请在模块内部添加容器物料。
      </p>
    </div>
    <ModuleContractSection v-if="isModuleEditor" />
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

.module-canvas-hint {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
