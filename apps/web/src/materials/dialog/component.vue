<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import DialogOverlay from './DialogOverlay.vue'
import { resolveDialogMaterialConfig } from './config.ts'

defineOptions({ name: 'DialogMaterial' })

/** 事件脚本可通过 `$context.trigger` 调用的方法,与描述符的 exposedMethods 对应。 */
export interface DialogMaterialExpose {
  open(): void
  close(): void
  toggle(): void
}

const { schema } = defineProps<{
  schema: MaterialSchema
}>()

const emit = defineEmits<{
  close: []
  closed: []
  open: []
  opened: []
}>()

const visible = ref(resolveDialogMaterialConfig(schema).defaultOpen)

function open() {
  visible.value = true
}

function close() {
  visible.value = false
}

function toggle() {
  visible.value = !visible.value
}

defineExpose<DialogMaterialExpose>({ close, open, toggle })
</script>

<template>
  <DialogOverlay
    v-model="visible"
    :schema="schema"
    @close="emit('close')"
    @closed="emit('closed')"
    @open="emit('open')"
    @opened="emit('opened')"
  >
    <slot />
  </DialogOverlay>
</template>
