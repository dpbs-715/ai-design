<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import { injectMaterialRenderContext } from '@/context/materialRender.ts'
import { resolveDialogMaterialConfig } from './config.ts'

defineOptions({ name: 'DialogMaterialOverlay' })

const { schema } = defineProps<{
  schema: MaterialSchema
}>()

const emit = defineEmits<{
  close: []
  closed: []
  open: []
  opened: []
}>()

const visible = defineModel<boolean>({ default: false })
const { overlayTarget } = injectMaterialRenderContext()
const appendTarget = computed(() => overlayTarget?.value)
const config = computed(() => resolveDialogMaterialConfig(schema))
const contentStyle = computed<CSSProperties>(() => ({
  height: `${config.value.contentHeight}px`,
  overflow:
    schema.childrenLayout?.type === 'absolute' && schema.childrenLayout.clip ? 'hidden' : 'visible',
}))

function emitClose() {
  emit('close')
}

function emitClosed() {
  emit('closed')
}

function emitOpen() {
  emit('open')
}

function emitOpened() {
  emit('opened')
}
</script>

<template>
  <CommonDialog
    v-if="appendTarget"
    v-model="visible"
    align-center
    footer-hide
    :append-to="appendTarget"
    :append-to-body="false"
    :close-on-click-modal="config.closeOnClickModal"
    :close-on-press-escape="config.closeOnPressEscape"
    :draggable="config.draggable"
    :lock-scroll="false"
    :modal="config.modal"
    :modal-blur="config.modalBlur"
    :modal-penetrable="!config.modal"
    modal-class="dialog-material-overlay"
    :show-close="config.showClose"
    :title="config.title"
    :width="`${config.width}px`"
    body-class="dialog-material-overlay__body"
    class="dialog-material-runtime"
    @close="emitClose"
    @closed="emitClosed"
    @open="emitOpen"
    @opened="emitOpened"
  >
    <div class="dialog-material-content" :style="contentStyle">
      <slot />
    </div>
  </CommonDialog>
</template>

<style lang="scss">
.dialog-material-overlay.el-overlay {
  position: absolute;
}

.dialog-material-runtime.commonDialog {
  --el-dialog-font-line-height: 20px;

  overflow: hidden;
  border: 1px solid var(--render-theme-border, var(--el-border-color));
  border-radius: 10px;
  background: var(--render-theme-container-background, var(--el-bg-color-overlay));
  box-shadow: 0 22px 60px rgb(0 0 0 / 24%);

  .el-dialog__header {
    display: flex;
    height: 52px;
    align-items: center;
    box-sizing: border-box;
    margin: 0;
    padding: 0 52px 0 20px;
    border-bottom: 1px solid var(--render-theme-border, var(--el-border-color));
    line-height: 20px;
  }

  .el-dialog__title {
    display: block;
    color: var(--render-theme-text-primary, var(--el-text-color-primary));
    font-size: 15px;
    font-weight: 600;
    line-height: 20px;
  }

  .el-dialog__headerbtn {
    top: 0;
    right: 0;
    display: grid;
    width: 52px;
    height: 52px;
    place-items: center;
    padding: 0;
    line-height: 1;
  }

  .el-dialog__close {
    display: block;
    margin: 0;
  }
}

.dialog-material-overlay__body {
  padding: 0 !important;
}

.dialog-material-content {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  background: var(--render-theme-container-background, var(--el-bg-color));
}
</style>
