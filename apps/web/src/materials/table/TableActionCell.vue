<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'
import { CommonButton } from '@vunio/ui'
import { h } from 'vue'
import type { TableActionSchema, TableColumnActionSchema } from './schema.ts'
import {
  isTableActionDisabled,
  isTableActionVisible,
  type TableCellContext,
} from './tableConfig.ts'

defineOptions({ name: 'DataTableActionCell' })

const props = defineProps<{
  column: TableColumnActionSchema
  context: TableCellContext
}>()

const emit = defineEmits<{
  action: [action: TableActionSchema, context: TableCellContext]
}>()

const visibleActions = computed(() =>
  props.column.actions.filter((action) => isTableActionVisible(action, props.context)),
)

function isDisabled(action: TableActionSchema) {
  return isTableActionDisabled(action, props.context)
}

function resolveIcon(action: TableActionSchema) {
  return action.icon ? () => h(IconifyIcon, { icon: action.icon, width: 16 }) : undefined
}
</script>

<template>
  <div class="data-table-action-cell">
    <CommonButton
      v-for="action in visibleActions"
      :key="action.id"
      :type="action.variant"
      :disabled="isDisabled(action)"
      :icon="resolveIcon(action)"
      size="small"
      :aria-label="action.label"
      @click="emit('action', action, context)"
    >
      {{ action.label }}
    </CommonButton>
    <span v-if="!visibleActions.length" class="data-table-action-cell__empty">—</span>
  </div>
</template>

<style scoped>
.data-table-action-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.data-table-action-cell__empty {
  color: var(--render-theme-text-placeholder);
}
</style>
