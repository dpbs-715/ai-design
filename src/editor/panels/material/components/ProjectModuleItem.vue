<script setup lang="ts">
import { finishMaterialDrag, startMaterialDrag } from '@/editor/canvas/materialDrag.ts'
import { createProjectModuleTemplate } from '@/materials/project-module'
import type { PublicModuleRecord } from '@/workspace/types.ts'

defineOptions({ name: 'ProjectModuleItem' })

const { publicModule } = defineProps<{
  publicModule: PublicModuleRecord
}>()

function startDrag(event: DragEvent) {
  const template = createProjectModuleTemplate(publicModule)
  startMaterialDrag(template)
  event.dataTransfer?.setData('schema', JSON.stringify(template))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <div
    class="project-module-item"
    draggable="true"
    :aria-label="`拖拽添加公共模块 ${publicModule.name}`"
    @dragstart="startDrag"
    @dragend="finishMaterialDrag"
  >
    <div class="module-preview">
      <span class="module-grid">
        <i v-for="index in 3" :key="index">
          <b></b>
          <small></small>
        </i>
      </span>
      <span class="module-version">{{ publicModule.version }}</span>
    </div>
    <div class="module-copy">
      <span>
        <strong>{{ publicModule.name }}</strong>
        <small>{{ publicModule.referenceCount }} 个页面引用</small>
      </span>
      <Icon icon="mdi:drag" width="15" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.project-module-item {
  padding: 10px 0 8px;
  border-bottom: 1px solid var(--border-color);
  cursor: grab;

  &:hover .module-preview {
    border-color: var(--accent-color);
    background: var(--accent-soft);
  }

  &:active {
    cursor: grabbing;
  }
}

.module-preview {
  position: relative;
  display: flex;
  height: 58px;
  align-items: center;
  justify-content: center;
  border: 1px dashed color-mix(in srgb, var(--accent-color) 45%, var(--border-color));
  border-radius: 5px;
  background: var(--surface-workbench);
  transition:
    border-color 140ms ease,
    background-color 140ms ease;
}

.module-grid {
  display: grid;
  width: 82%;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;

  i {
    display: flex;
    height: 31px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    border: 1px solid var(--border-color);
    border-radius: 3px;
    background: var(--surface-panel);
  }

  b {
    width: 34%;
    height: 3px;
    background: var(--text-secondary);
  }

  small {
    width: 54%;
    height: 2px;
    background: var(--border-color-strong);
  }
}

.module-version {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--accent-color);
  font-size: 8px;
  font-weight: 700;
}

.module-copy {
  display: flex;
  min-width: 0;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  padding-top: 7px;
  color: var(--text-muted);

  > span {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  strong {
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    margin-top: 3px;
    font-size: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .module-preview {
    transition: none;
  }
}
</style>
