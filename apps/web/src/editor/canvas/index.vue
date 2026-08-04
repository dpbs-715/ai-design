<script setup lang="ts">
import {
  canMaterialAcceptChild,
  canMaterialTypeBeChild,
  getConfiguredMaterialEvents,
  getMaterialEventOptions,
  isOverlayMaterial,
} from '@/materials'
import Selecto from 'vue3-selecto'
import Moveable from 'vue3-moveable'
import { useEventListener } from '@vunio/hooks'
import { SetFormFieldCommand } from '@vunio/ui'
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import type { MaterialEvent, MaterialSchema } from '@/schema/material.ts'
import SketchRuler from 'vue3-sketch-ruler'
import 'vue3-sketch-ruler/lib/style.css'
import { useCanvasRuler } from '@/editor/canvas/composables/useCanvasRuler.ts'
import { useCanvasZoom } from '@/editor/canvas/composables/useCanvasZoom.ts'
import { useMoveable } from '@/editor/canvas/composables/useMoveable.ts'
import { useSelection, type CanvasSelectoRef } from '@/editor/canvas/composables/useSelection.ts'
import NodeContextMenu from '@/editor/canvas/components/NodeContextMenu.vue'
import CanvasContextMenu from '@/editor/canvas/components/CanvasContextMenu.vue'
import CanvasZoomControl from '@/editor/canvas/components/CanvasZoomControl.vue'
import CanvasEventTrigger from '@/editor/canvas/components/CanvasEventTrigger.vue'
import CanvasNode from '@/editor/canvas/components/CanvasNode.vue'
import CanvasBackground from '@/components/CanvasBackground/index.vue'
import { useCanvasContextMenu } from '@/editor/canvas/composables/useCanvasContextMenu.ts'
import { useCanvasViewport } from '@/editor/canvas/composables/useCanvasViewport.ts'
import { useCanvasShortcutFocus } from '@/editor/canvas/composables/useCanvasShortcutFocus.ts'
import { useCanvasClipboardActions } from '@/editor/canvas/composables/useCanvasClipboardActions.ts'
import { useCanvasShortcuts } from '@/editor/canvas/composables/useCanvasShortcuts.ts'
import { useRenderTheme } from '@/theme/renderTheme.ts'
import { provideMaterialRenderContext } from '@/context/materialRender.ts'
import { findCanvasDropTarget } from '@/editor/canvas/canvasTarget.ts'
import { provideMaterialEditorContext } from '@/editor/canvas/materialEditorContext.ts'
import { getDraggedMaterialTemplate } from '@/editor/canvas/materialDrag.ts'
import {
  createCanvasDropNode,
  getCanvasDropType,
  placeCanvasDropNode,
  type CanvasDropNode,
} from '@/editor/canvas/materialDrop.ts'
import { useRoute } from 'vue-router'
import { createRuntimeContext, type RuntimeEventFailure } from '@/runtime/context.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'CanvasRoot',
})
const editorStore = useEditorStore()
const route = useRoute()
const canvasRootRef = useTemplateRef<HTMLDivElement>('canvasRoot')
const overlayRootRef = useTemplateRef<HTMLDivElement>('overlayRoot')
const moveableRef = useTemplateRef('moveable')
const selectoRef = useTemplateRef<CanvasSelectoRef>('selecto')
const stageRef = useTemplateRef('stage')
provideMaterialRenderContext({ mode: 'editor', overlayTarget: overlayRootRef })
const dropTargetId = ref<string>()
const isModuleEditor = computed(() => route.name === 'ProjectModuleEditor')

const {
  height: viewportHeight,
  width: viewportWidth,
  measured: viewportMeasured,
} = useCanvasViewport(canvasRootRef)
useCanvasShortcutFocus(canvasRootRef)
const { page, root, rootChildren, selectedNode, selectedNodeId, selectedNodeIds } =
  storeToRefs(editorStore)
const { resolvedMode, rootStyle: renderThemeStyle } = useRenderTheme()
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()
const activeOverlayId = ref<string>()
const activeOverlay = computed(() =>
  activeOverlayId.value ? editorStore.findNode(activeOverlayId.value) : undefined,
)

function findNodeOverlay(nodeId: string | null | undefined) {
  let currentId = nodeId
  while (currentId) {
    const node = editorStore.findNode(currentId)
    if (!node) return
    if (isOverlayMaterial(node.type)) return node
    currentId = editorStore.findParentId(currentId)
  }
}

function enterOverlayEditor(nodeId: string) {
  const overlay = findNodeOverlay(nodeId)
  if (!overlay) return
  activeOverlayId.value = overlay.id
  if (editorStore.selectedNodeId !== overlay.id) editorStore.selectNode(overlay.id)
}

function exitOverlayEditor() {
  if (!activeOverlayId.value) return false
  activeOverlayId.value = undefined
  editorStore.clearSelection()
  return true
}

function closeOverlayEditor(nodeId: string) {
  const overlay = findNodeOverlay(nodeId)
  if (overlay?.id === activeOverlayId.value) exitOverlayEditor()
}

watch(selectedNodeId, (nodeId) => {
  if (!nodeId) return
  activeOverlayId.value = findNodeOverlay(nodeId)?.id
})

watch(activeOverlay, (overlay) => {
  if (activeOverlayId.value && !overlay) activeOverlayId.value = undefined
})

function reportEventFailure({ error, event, node }: RuntimeEventFailure) {
  const reason = error instanceof Error ? error.message : '未知错误'
  ElMessage.error(`“${node.name}”的“${event.title ?? event.name}”执行失败：${reason}`)
}

const runtimeContext = createRuntimeContext(page, {
  onEventFailure: reportEventFailure,
  writeAttribute: (node, key, value) => {
    dispatchCommand(new SetFormFieldCommand(() => editorStore.requireNode(node.id), key, value))
  },
})
const runningEventName = ref<string>()
const eventTriggerPositionRevision = ref(0)

const {
  isMoveableActive,
  onDrag,
  onStart,
  onResizeStart,
  onResizeGroupStart,
  onEnd,
  onResize,
  onDragGroup,
  onResizeGroup,
} = useMoveable()
const {
  canvasWidth,
  canvasHeight,
  canvasStyle,
  scale,
  lines,
  palette,
  updateMoveableRect,
  onCanvasTransformChange,
} = useCanvasRuler({
  moveableRef,
  isMoveableActive,
})
const { isCanvasPanMode, isCanvasPanning, fitCanvas, centerCanvas, setCanvasScale, isCanvasFit } =
  useCanvasZoom({
    viewportWidth,
    viewportHeight,
    viewportMeasured,
    canvasWidth,
    canvasHeight,
    scale,
  })
const { selectedTarget, onSelect, onClearSelected, onSelectEnd } = useSelection({
  stageRef,
  selectoRef,
  moveableRef,
  isMoveableActive,
})
const eventTriggerTarget = computed(() =>
  selectedTarget.value.length === 1 ? selectedTarget.value[0] : undefined,
)
const configuredEvents = computed(() =>
  selectedNode.value ? getConfiguredMaterialEvents(selectedNode.value) : [],
)
const unsupportedEventReasons = computed<Record<string, string>>(() => {
  const node = selectedNode.value
  if (!node) return {}

  return Object.fromEntries(
    configuredEvents.value.flatMap((event) => {
      const payloadType = getMaterialEventOptions(node.type).find(
        (option) => option.value === event.type,
      )?.payloadType
      return payloadType && payloadType !== 'MouseEvent'
        ? [[event.name, `该事件需要 ${payloadType} payload，请在预览中触发`]]
        : []
    }),
  )
})

function createEditorEventPayload(node: MaterialSchema, event: MaterialEvent) {
  const eventOption = getMaterialEventOptions(node.type).find(
    (option) => option.value === event.type,
  )
  if (eventOption?.payloadType !== 'MouseEvent') return

  const targetRect = eventTriggerTarget.value?.getBoundingClientRect()
  return new MouseEvent(event.type, {
    bubbles: true,
    cancelable: true,
    clientX: targetRect ? targetRect.left + targetRect.width / 2 : 0,
    clientY: targetRect ? targetRect.top + targetRect.height / 2 : 0,
    view: window,
  })
}

async function runSelectedEvent(event: MaterialEvent) {
  const node = selectedNode.value
  if (!node || runningEventName.value || unsupportedEventReasons.value[event.name]) return

  runningEventName.value = event.name
  startBatch()
  try {
    await runtimeContext.executeEvent(node, event, createEditorEventPayload(node, event))
  } catch (error) {
    runtimeContext.reportEventFailure({ error, event, node })
  } finally {
    commitBatch()
    runningEventName.value = undefined
  }
}
const { copyNodes, cutNodes, pasteAt, pasteFromClipboard } = useCanvasClipboardActions()
const {
  contextMenuTarget,
  contextMenuNodes,
  contextMenuAnchor,
  onContextMenu,
  closeContextMenu,
  onContextMenuCommand,
} = useCanvasContextMenu({ canvasRootRef, stageRef, scale, copyNodes, pasteAt })
useCanvasShortcuts({
  copyNodes,
  cutNodes,
  pasteFromClipboard,
  closeContextMenu,
  onEscape: exitOverlayEditor,
})

function onStageMouseDown(event: MouseEvent) {
  if (event.target === stageRef.value && !event.shiftKey && !isCanvasPanMode.value) {
    onClearSelected()
  }
}

function findUnlockedNodeAtPoint(event: MouseEvent) {
  const stage = stageRef.value
  if (!stage) return

  const visitedNodeIds = new Set<string>()
  for (const element of document.elementsFromPoint(event.clientX, event.clientY)) {
    const nodeElement = element.closest<HTMLElement>('[data-node-id]')
    const nodeId = nodeElement?.dataset.nodeId
    if (!nodeElement || !nodeId || !stage.contains(nodeElement) || visitedNodeIds.has(nodeId)) {
      continue
    }

    visitedNodeIds.add(nodeId)
    const node = editorStore.findNode(nodeId)
    if (node && !editorStore.getNodeLockKey(node.id)) return node
  }
}

function onNodeMouseDown(node: MaterialSchema, event: MouseEvent) {
  if (event.button !== 0 || isCanvasPanMode.value) return
  const targetNode = editorStore.getNodeLockKey(node.id) ? findUnlockedNodeAtPoint(event) : node
  if (!targetNode) {
    onClearSelected()
    return
  }
  onSelect(targetNode, event)
}

provideMaterialEditorContext({
  selectedNodeIds,
  isNodeLocked: (id) => Boolean(editorStore.getNodeLockKey(id)),
  onNodeMouseDown,
  insertNode: (node, parentId, index) => editorStore.addNode(node, parentId, index),
  reorderChildren: editorStore.reorderChildren,
})

function onCanvasMouseDown(event: MouseEvent) {
  onStageMouseDown(event)
  closeContextMenu()
}

let canvasTransformActive = false
let canvasTransformIdleFrame: number | undefined

function onCanvasTransform() {
  onCanvasTransformChange()
  eventTriggerPositionRevision.value += 1
  // SketchRuler keeps emitting during easing. Close once per transform session so a context
  // menu opened during the trailing frames is not immediately unmounted again.
  if (!canvasTransformActive) {
    canvasTransformActive = true
    closeContextMenu()
  }

  if (canvasTransformIdleFrame !== undefined) cancelAnimationFrame(canvasTransformIdleFrame)
  canvasTransformIdleFrame = requestAnimationFrame(() => {
    canvasTransformIdleFrame = requestAnimationFrame(() => {
      canvasTransformIdleFrame = undefined
      canvasTransformActive = false
    })
  })
}

onScopeDispose(() => {
  if (canvasTransformIdleFrame !== undefined) cancelAnimationFrame(canvasTransformIdleFrame)
})

watch(
  isCanvasPanning,
  (panning, _, onCleanup) => {
    if (!panning) {
      onCanvasTransformChange()
      return
    }

    let syncFrame: number | undefined
    const syncMoveable = () => {
      updateMoveableRect()
      eventTriggerPositionRevision.value += 1
      syncFrame = requestAnimationFrame(syncMoveable)
    }
    syncMoveable()

    onCleanup(() => {
      if (syncFrame !== undefined) cancelAnimationFrame(syncFrame)
    })
  },
  { flush: 'post' },
)

function getDropTarget(clientX: number, clientY: number, childType?: string) {
  const stage = stageRef.value
  if (!stage) return null
  return findCanvasDropTarget(
    stage,
    root.value.id,
    clientX,
    clientY,
    scale.value,
    childType
      ? (parentId) => {
          const parent = parentId === root.value.id ? root.value : editorStore.findNode(parentId)
          return Boolean(
            parent &&
            canMaterialTypeBeChild(parent, childType) &&
            (parentId === root.value.id || !editorStore.getNodeLockKey(parentId)),
          )
        }
      : undefined,
  )
}

function clearDropTarget() {
  dropTargetId.value = undefined
}

function onDragLeave(event: DragEvent) {
  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && stageRef.value?.contains(nextTarget)) return
  clearDropTarget()
}

useEventListener('dragend', clearDropTarget)

function onDrop(e: DragEvent) {
  clearDropTarget()
  const data = e.dataTransfer.getData('schema')
  if (!data) return
  let dropNode: CanvasDropNode | undefined
  try {
    dropNode = createCanvasDropNode(JSON.parse(data))
  } catch {
    return
  }
  if (!dropNode) return

  const { node, selectedNodeId } = dropNode
  const dropTarget = getDropTarget(e.clientX, e.clientY, node.type)
  if (!dropTarget) return
  const parentId = dropTarget.parentId
  const parent = parentId === root.value.id ? root.value : editorStore.findNode(parentId)
  if (!parent || !canMaterialAcceptChild(parent, node) || !placeCanvasDropNode(node, dropTarget)) {
    return
  }

  if (editorStore.addNode(node, parentId)) editorStore.selectNode(selectedNodeId)
}

function onDragOver(event: DragEvent) {
  const template = getDraggedMaterialTemplate()
  if (!template) {
    clearDropTarget()
    return
  }

  const canvasChildType = getCanvasDropType(template)
  const dropTarget = getDropTarget(event.clientX, event.clientY, canvasChildType)
  const parent =
    dropTarget?.parentId === root.value.id ? root.value : editorStore.findNode(dropTarget?.parentId)
  if (
    !dropTarget ||
    !parent ||
    !canMaterialTypeBeChild(parent, canvasChildType) ||
    (dropTarget.parentId !== root.value.id && editorStore.getNodeLockKey(dropTarget.parentId))
  ) {
    dropTargetId.value = undefined
    return
  }
  dropTargetId.value = dropTarget?.parentId === root.value.id ? undefined : dropTarget?.parentId
}

const stageStyle = computed(() => ({
  ...canvasStyle.value,
  ...renderThemeStyle.value,
}))

const selectedParentId = computed(() => {
  const parentIds = new Set(
    selectedNodeIds.value.flatMap((id) => {
      const parentId = editorStore.findParentId(id)
      return parentId ? [parentId] : []
    }),
  )
  return parentIds.size === 1 ? parentIds.values().next().value : root.value.id
})

const moveableSnapContainer = computed(() => {
  const stage = stageRef.value
  if (!stage || selectedParentId.value === root.value.id) return stage

  return (
    Array.from(stage.querySelectorAll<HTMLElement>('[data-container-id]')).find(
      (element) => element.dataset.containerId === selectedParentId.value,
    ) ?? stage
  )
})

const moveableBounds = {
  position: 'css' as const,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
}
</script>

<template>
  <div
    class="canvas-root"
    :class="{ 'is-canvas-pan-mode': isCanvasPanMode }"
    ref="canvasRoot"
    @mousedown.capture="onCanvasMouseDown"
    @contextmenu.capture="onContextMenu"
  >
    <SketchRuler
      v-if="viewportMeasured"
      ref="sketchRuler"
      v-model:scale="scale"
      :palette="palette"
      :width="viewportWidth"
      :height="viewportHeight"
      :canvasWidth="canvasWidth"
      :canvasHeight="canvasHeight"
      :thick="20"
      :lines="lines"
      :enable-animation="true"
      animation-mode="ease-out"
      @zoomchange="onCanvasTransform"
    >
      <template #default>
        <div
          ref="stage"
          class="canvas-stage"
          :class="{ 'is-module-stage': isModuleEditor }"
          :data-render-theme="resolvedMode"
          :style="stageStyle"
          @dragover.capture.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <CanvasBackground :background="root.style.background" />
          <div ref="overlayRoot" class="canvas-overlay-root"></div>
          <CanvasNode
            v-for="node in rootChildren"
            :key="node.id"
            :node="node"
            :parent-id="root.id"
            :runtime-context="runtimeContext"
            :editor-visible="
              isOverlayMaterial(node.type) ? activeOverlayId === node.id : !activeOverlayId
            "
            :overlay-active="activeOverlayId === node.id"
            :root-child="true"
            :drop-target-id="dropTargetId"
            :on-node-mouse-down="onNodeMouseDown"
            :on-overlay-open="enterOverlayEditor"
            :on-overlay-close="closeOverlayEditor"
          />
        </div>
      </template>
      <template #toolbar="{ state }">
        <CanvasZoomControl
          class="canvas-zoom"
          :scale="state.scale"
          :fit-active="isCanvasFit(state)"
          @fit="fitCanvas"
          @center="centerCanvas"
          @zoom="setCanvasScale"
        />
      </template>
    </SketchRuler>
    <nav v-if="activeOverlay" class="canvas-editing-path" aria-label="编辑路径">
      <button type="button" aria-label="返回页面编辑" @click="exitOverlayEditor">
        <Icon icon="fluent:arrow-left-20-regular" width="15" />
        <span>页面</span>
      </button>
      <Icon
        class="canvas-editing-path__separator"
        icon="fluent:chevron-right-20-filled"
        width="13"
      />
      <strong>{{ activeOverlay.name }}</strong>
      <small>弹窗编辑</small>
    </nav>
    <el-dropdown
      v-if="contextMenuTarget"
      ref="contextMenu"
      trigger="contextmenu"
      virtual-triggering
      :virtual-ref="contextMenuAnchor"
      :show-arrow="false"
      placement="bottom-start"
      popper-class="node-context-menu-popper"
      @command="onContextMenuCommand"
    >
      <template #dropdown>
        <CanvasContextMenu v-if="contextMenuTarget.kind === 'canvas'" />
        <NodeContextMenu v-else :nodes="contextMenuNodes" :target-kind="contextMenuTarget.kind" />
      </template>
    </el-dropdown>
    <Selecto
      v-if="stageRef && !isCanvasPanMode"
      ref="selecto"
      :container="stageRef"
      :dragContainer="stageRef"
      :selectableTargets="['.canvas-node.is-root-child:not(.is-locked):not(.is-editor-hidden)']"
      :selectFromInside="false"
      :toggleContinueSelect="'shift'"
      @selectEnd="onSelectEnd"
    ></Selecto>
    <Moveable
      v-if="selectedNodeIds.length && selectedTarget.length"
      ref="moveable"
      :target="selectedTarget"
      :draggable="!isCanvasPanMode"
      :resizable="true"
      :origin="false"
      :snappable="true"
      :snapContainer="moveableSnapContainer"
      :bounds="moveableBounds"
      @drag="onDrag"
      @dragStart="onStart"
      @dragEnd="onEnd"
      @dragGroup="onDragGroup"
      @dragGroupStart="onStart"
      @dragGroupEnd="onEnd"
      @resize="onResize"
      @resizeStart="onResizeStart"
      @resizeEnd="onEnd"
      @resizeGroup="onResizeGroup"
      @resizeGroupStart="onResizeGroupStart"
      @resizeGroupEnd="onEnd"
    ></Moveable>
    <CanvasEventTrigger
      v-if="
        canvasRootRef &&
        eventTriggerTarget &&
        configuredEvents.length &&
        !isMoveableActive &&
        !isCanvasPanMode
      "
      :container="canvasRootRef"
      :target="eventTriggerTarget"
      :events="configuredEvents"
      :node-name="selectedNode.name"
      :position-revision="eventTriggerPositionRevision"
      :running-event-name="runningEventName"
      :unsupported-event-reasons="unsupportedEventReasons"
      @run="runSelectedEvent"
    />
  </div>
</template>

<style scoped lang="scss">
.canvas-root {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: var(--surface-workbench);

  .canvas-stage {
    position: relative;
    box-shadow: var(--el-box-shadow-light);
  }

  .canvas-overlay-root {
    position: absolute;
    z-index: 1000;
    inset: 0;
    pointer-events: none;

    :deep(.el-overlay) {
      pointer-events: auto;
    }
  }

  .canvas-stage.is-module-stage {
    background-color: color-mix(in srgb, var(--surface-panel) 88%, transparent);
    background-image:
      linear-gradient(45deg, var(--border-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--border-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--border-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--border-color) 75%);
    background-position:
      0 0,
      0 12px,
      12px -12px,
      -12px 0;
    background-size: 24px 24px;
    box-shadow:
      0 0 0 2px var(--accent-color),
      0 0 0 9px var(--accent-soft),
      var(--el-box-shadow-light);
  }

  .canvas-zoom {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 10;
  }

  .canvas-editing-path {
    position: absolute;
    z-index: 20;
    top: 30px;
    left: 50%;
    display: flex;
    height: 34px;
    align-items: center;
    gap: 7px;
    padding: 0 10px 0 6px;
    border: 1px solid var(--border-color-strong);
    border-radius: 7px;
    background: color-mix(in srgb, var(--surface-panel) 94%, transparent);
    box-shadow: 0 8px 24px color-mix(in srgb, #000 18%, transparent);
    color: var(--text-secondary);
    font-size: 11px;
    transform: translateX(-50%);
    backdrop-filter: blur(10px);

    button {
      display: inline-flex;
      height: 26px;
      align-items: center;
      gap: 5px;
      padding: 0 7px;
      border: 0;
      border-radius: 5px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font: inherit;

      &:hover {
        background: var(--surface-hover);
        color: var(--text-primary);
      }

      &:focus-visible {
        outline: 2px solid var(--accent-color);
        outline-offset: 1px;
      }
    }

    strong {
      max-width: 220px;
      overflow: hidden;
      color: var(--text-primary);
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      padding: 3px 6px;
      border-radius: 99px;
      background: var(--accent-soft);
      color: var(--accent-color);
      font-size: 9px;
      font-weight: 600;
    }
  }

  .canvas-editing-path__separator {
    flex: none;
    color: var(--text-muted);
  }
}

.canvas-root.is-canvas-pan-mode {
  .canvas-stage,
  :deep(.moveable-control-box) {
    pointer-events: none;
  }
}
</style>
