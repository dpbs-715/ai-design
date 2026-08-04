<script setup lang="ts">
import type { MaterialEvent } from '@/schema/material.ts'

defineOptions({ name: 'CanvasEventTrigger' })

const {
  container,
  events,
  nodeName,
  positionRevision,
  runningEventName,
  target,
  unsupportedEventReasons,
} = defineProps<{
  container: HTMLElement
  events: MaterialEvent[]
  nodeName: string
  positionRevision: number
  runningEventName?: string
  target: HTMLElement
  unsupportedEventReasons: Record<string, string>
}>()

const emit = defineEmits<{
  run: [event: MaterialEvent]
}>()

const toolbarRef = useTemplateRef<HTMLDivElement>('toolbar')
const positionStyle = shallowRef<Record<string, string>>({ visibility: 'hidden' })
const primaryEvent = computed(
  () =>
    events.find((event) => event.type === 'click' && !getUnsupportedReason(event)) ??
    events.find((event) => !getUnsupportedReason(event)) ??
    events.find((event) => event.type === 'click') ??
    events[0]!,
)
const hasMultipleEvents = computed(() => events.length > 1)

function getEventLabel(event: MaterialEvent) {
  return event.title?.trim() || event.name
}

function getUnsupportedReason(event: MaterialEvent) {
  return unsupportedEventReasons[event.name]
}

function runEvent(event: MaterialEvent) {
  if (runningEventName || getUnsupportedReason(event)) return
  emit('run', event)
}

function runEventByName(eventName: string) {
  const event = events.find((candidate) => candidate.name === eventName)
  if (event) runEvent(event)
}

let mutationObserver: MutationObserver | undefined
let resizeObserver: ResizeObserver | undefined
let positionFrame: number | undefined
let previousPosition = ''

function syncPosition() {
  positionFrame = undefined
  const toolbar = toolbarRef.value
  if (!toolbar || !target.isConnected || !container.isConnected) {
    positionStyle.value = { visibility: 'hidden' }
    return
  }

  const targetRect = target.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const toolbarRect = toolbar.getBoundingClientRect()
  const edgePadding = 8
  const offset = 8
  const placeBelow = targetRect.top - containerRect.top < toolbarRect.height + offset + edgePadding
  const unclampedLeft = targetRect.left + targetRect.width / 2 - containerRect.left
  const halfToolbarWidth = toolbarRect.width / 2
  const left = Math.min(
    Math.max(unclampedLeft, halfToolbarWidth + edgePadding),
    containerRect.width - halfToolbarWidth - edgePadding,
  )
  const top = placeBelow
    ? targetRect.bottom - containerRect.top + offset
    : targetRect.top - containerRect.top - offset
  const position = `${left}:${top}:${placeBelow ? 'below' : 'above'}`

  if (position !== previousPosition) {
    previousPosition = position
    positionStyle.value = {
      left: `${left}px`,
      top: `${top}px`,
      transform: placeBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)',
      visibility: 'visible',
    }
  }
}

function schedulePositionSync() {
  if (positionFrame !== undefined) return
  positionFrame = requestAnimationFrame(syncPosition)
}

function observePositionSources() {
  const toolbar = toolbarRef.value
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  if (!toolbar) return

  resizeObserver?.observe(container)
  resizeObserver?.observe(target)
  resizeObserver?.observe(toolbar)
  mutationObserver?.observe(target, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  })
  schedulePositionSync()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(schedulePositionSync)
  mutationObserver = new MutationObserver(schedulePositionSync)
  window.addEventListener('resize', schedulePositionSync)
  window.addEventListener('scroll', schedulePositionSync, true)
  observePositionSources()
})

watch([() => container, () => target], async () => {
  await nextTick()
  observePositionSources()
})

watch(() => positionRevision, schedulePositionSync)

onScopeDispose(() => {
  if (positionFrame !== undefined) cancelAnimationFrame(positionFrame)
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  window.removeEventListener('resize', schedulePositionSync)
  window.removeEventListener('scroll', schedulePositionSync, true)
})
</script>

<template>
  <div
    ref="toolbar"
    class="canvas-event-trigger"
    :style="positionStyle"
    role="toolbar"
    :aria-label="`运行“${nodeName}”的事件`"
    @mousedown.stop
    @click.stop
  >
    <button
      type="button"
      class="canvas-event-trigger__run"
      :disabled="Boolean(runningEventName || getUnsupportedReason(primaryEvent))"
      :title="getUnsupportedReason(primaryEvent)"
      @click="runEvent(primaryEvent)"
    >
      <Icon
        :icon="runningEventName ? 'fluent:spinner-ios-20-regular' : 'fluent:flash-20-filled'"
        width="15"
        :class="{ 'is-spinning': runningEventName }"
      />
      <span>{{
        runningEventName
          ? '正在运行'
          : getUnsupportedReason(primaryEvent)
            ? '请在预览中触发'
            : `运行${getEventLabel(primaryEvent)}`
      }}</span>
    </button>

    <el-dropdown
      v-if="hasMultipleEvents"
      trigger="click"
      placement="bottom-end"
      popper-class="canvas-event-trigger-menu"
      :disabled="Boolean(runningEventName)"
      @command="runEventByName"
    >
      <button
        type="button"
        class="canvas-event-trigger__more"
        :disabled="Boolean(runningEventName)"
        aria-label="选择要运行的事件"
      >
        <Icon icon="fluent:chevron-down-16-regular" width="13" />
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="event in events"
            :key="event.name"
            :command="event.name"
            :disabled="Boolean(getUnsupportedReason(event))"
            :title="getUnsupportedReason(event)"
          >
            <Icon icon="fluent:flash-16-regular" width="14" />
            <span class="canvas-event-trigger-menu__copy">
              <strong>{{ getEventLabel(event) }}</strong>
              <small>{{ event.type }}</small>
            </span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.canvas-event-trigger {
  position: absolute;
  z-index: 120;
  display: inline-flex;
  height: 28px;
  overflow: hidden;
  border: 1px solid var(--border-color-strong);
  border-radius: 6px;
  background: color-mix(in srgb, var(--surface-raised) 96%, transparent);
  box-shadow: var(--el-box-shadow-lighter);
  color: var(--text-primary);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  white-space: nowrap;
}

.canvas-event-trigger__run,
.canvas-event-trigger__more {
  display: inline-flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    background: var(--accent-soft);
    color: var(--accent-color-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: -2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
}

.canvas-event-trigger__run {
  max-width: 220px;
  gap: 5px;
  padding: 0 9px;
  font-size: 11px;
  font-weight: 600;

  > svg {
    flex: none;
    color: var(--accent-color);
  }

  > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.canvas-event-trigger__more {
  width: 25px;
  padding: 0;
  border-left: 1px solid var(--border-color);
  color: var(--text-muted);
}

.is-spinning {
  animation: canvas-event-trigger-spin 800ms linear infinite;
}

@keyframes canvas-event-trigger-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-spinning {
    animation: none;
  }
}
</style>

<style lang="scss">
.canvas-event-trigger-menu.el-popper {
  min-width: 176px;
  border: 1px solid var(--border-color-strong);
  background: color-mix(in srgb, var(--surface-raised) 96%, transparent);
  box-shadow: var(--el-box-shadow-light);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);

  .el-dropdown-menu {
    padding: 5px;
    background: transparent;
  }

  .el-dropdown-menu__item {
    display: grid;
    min-width: 0;
    height: 42px;
    grid-template-columns: 16px minmax(0, 1fr);
    gap: 7px;
    padding: 0 8px;
    border-radius: 4px;
    color: var(--text-secondary);

    &:hover,
    &:focus {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    > svg {
      color: var(--accent-color);
    }
  }
}

.canvas-event-trigger-menu__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 12px;
    font-weight: 600;
  }

  small {
    color: var(--text-muted);
    font-size: 10px;
  }
}
</style>
