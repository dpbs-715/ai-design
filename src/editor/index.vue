<script setup lang="ts">
import ToolbarLeft from '@/editor/toolbar/ToolbarLeft.vue'
import ToolbarRight from '@/editor/toolbar/ToolbarRight.vue'
import { useEditorStore } from '@/stores/editor.ts'
import MaterialPanel from '@/editor/panels/material/index.vue'
import LayerPanel from '@/editor/panels/layer/index.vue'
import CanvasRoot from '@/editor/canvas/index.vue'
import PropertyPanel from '@/editor/panels/property/index.vue'
import { storeToRefs } from 'pinia'
import { provideDataSources } from '@/context'
import { useRoute } from 'vue-router'
import { getPublishPage } from '@/utils/publish.ts'
import { useResponsiveEditorLayout } from '@/editor/composables/useResponsiveEditorLayout.ts'

defineOptions({ name: 'ScreenEditor' })

const route = useRoute()
const editorStore = useEditorStore()

const pageId = route.query.id
if (pageId) {
  const page = getPublishPage(route.query.id as string)
  editorStore.setPage(page)
}

const { dataSources } = storeToRefs(editorStore)

provideDataSources(dataSources)

const { isNarrowWorkspace, materialWidth, layerWidth, propertyWidth } = useResponsiveEditorLayout()
</script>

<template>
  <div class="editor h-screen select-none" :class="{ 'is-narrow': isNarrowWorkspace }">
    <header class="header h-56 flex justify-between items-center px-20">
      <ToolbarLeft class="editor-toolbar editor-toolbar-left" />
      <div class="editor-title flex-1 text-center">未命名大屏</div>
      <ToolbarRight class="editor-toolbar editor-toolbar-right" />
    </header>
    <main class="editor-main flex">
      <!--  物料  -->
      <MaterialPanel
        class="material overflow-hidden transition-all"
        :style="{ width: materialWidth }"
      />
      <!--  图层  -->
      <LayerPanel class="layer overflow-hidden transition-all" :style="{ width: layerWidth }" />
      <!--  画布  -->
      <CanvasRoot class="canvas flex-1" />
      <!--  属性  -->
      <PropertyPanel
        class="property overflow-hidden transition-all"
        :style="{ width: propertyWidth }"
      />
    </main>
  </div>
</template>

<style scoped lang="scss">
.editor {
  background: var(--surface-workbench);
  color: var(--text-primary);

  .header {
    position: relative;
    z-index: 10;
    gap: 12px;
    background: var(--surface-panel);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 1px 0 rgb(255 255 255 / 2%);
  }

  .editor-toolbar {
    width: 300px;
    min-width: 0;
  }

  .editor-title {
    min-width: 0;
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .editor-main {
    height: calc(100% - 56px);
  }

  .material,
  .layer {
    border-right: 1px solid var(--border-color);
  }

  .property {
    background: var(--surface-panel);
    border-left: 1px solid var(--border-color);
  }

  .canvas {
    min-width: 0;
  }

  &.is-narrow {
    .header {
      gap: 8px;
      padding-right: 12px;
      padding-left: 12px;
    }

    .editor-toolbar {
      width: auto;
      flex: none;
    }
  }
}

@media (max-width: 699px) {
  .editor.is-narrow .editor-title {
    display: none;
  }
}
</style>
