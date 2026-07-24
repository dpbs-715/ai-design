<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import { getMaterialIcon, isContainerMaterial } from '@/materials'
import { useEditorStore } from '@/stores/editor.ts'

defineOptions({ name: 'LayerTreeNode' })

const editorStore = useEditorStore()
const props = defineProps<{
  node: MaterialSchema
  depth: number
  selectedNodeIds: string[]
}>()

const emit = defineEmits<{
  select: [id: string]
  dragStart: [id: string]
  drop: [id: string]
}>()

const isExpanded = ref(true)
const orderedChildren = computed(() => [...props.node.children].reverse())
const effectiveLockKey = computed(() => editorStore.getNodeLockKey(props.node.id))

function onDragStart(event: DragEvent) {
  event.dataTransfer?.setData('layer-node-id', props.node.id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  emit('dragStart', props.node.id)
}

function onDrop(event: DragEvent) {
  if (!event.dataTransfer?.getData('layer-node-id')) return
  event.preventDefault()
  event.stopPropagation()
  emit('drop', props.node.id)
}
</script>

<template>
  <div class="layer-tree-node">
    <div
      class="layer-row"
      :class="{ active: selectedNodeIds.includes(node.id), 'is-locked': effectiveLockKey }"
      :style="{ paddingLeft: `${8 + depth * 16}px` }"
      :draggable="!effectiveLockKey"
      @click="emit('select', node.id)"
      @dragstart="onDragStart"
      @dragover.prevent
      @drop="onDrop"
    >
      <button
        v-if="isContainerMaterial(node.type)"
        class="expand-button"
        type="button"
        :aria-label="isExpanded ? '折叠容器' : '展开容器'"
        @click.stop="isExpanded = !isExpanded"
      >
        <Icon
          icon="fluent:chevron-right-20-filled"
          width="13"
          :class="{ 'is-expanded': isExpanded }"
        />
      </button>
      <span v-else class="expand-placeholder" />
      <Icon :icon="getMaterialIcon(node.type)" width="15" />
      <span class="layer-name">{{ node.name }}</span>
      <Icon
        v-if="effectiveLockKey"
        class="lock-icon"
        icon="fluent:lock-closed-20-filled"
        width="13"
      />
    </div>

    <div v-if="isExpanded && node.children.length" class="layer-children">
      <LayerTreeNode
        v-for="child in orderedChildren"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-node-ids="selectedNodeIds"
        @select="emit('select', $event)"
        @drag-start="emit('dragStart', $event)"
        @drop="emit('drop', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.layer-row {
  display: flex;
  height: 30px;
  align-items: center;
  gap: 6px;
  padding-right: 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
}

.layer-row:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.layer-row.active {
  border-color: color-mix(in srgb, var(--accent-color) 34%, transparent);
  background: var(--accent-soft);
  color: var(--accent-color);
}

.layer-row.is-locked {
  opacity: 0.62;
}

.expand-button,
.expand-placeholder {
  display: grid;
  width: 14px;
  height: 20px;
  flex: none;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
}

.expand-button :deep(svg) {
  transition: transform 140ms ease;
}

.expand-button :deep(svg).is-expanded {
  transform: rotate(90deg);
}

.layer-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
}

.lock-icon {
  flex: none;
}
</style>
