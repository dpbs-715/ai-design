<script setup lang="ts">
import type { CommonFormConfig } from '@vunio/ui'
import { ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import { getMaterialEventOptions } from '@/materials'
import type { MaterialEvent } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'

defineOptions({ name: 'PropertyEventSection' })

const emit = defineEmits<{
  openCodeEditor: [eventIndex: number]
}>()

const editorStore = useEditorStore()
const { selectedNode: selectedNodeRef } = storeToRefs(editorStore)
const { dispatchCommand } = useUndoRedo()
const selectedNode = computed(() => selectedNodeRef.value!)

const events = computed(() => selectedNode.value.events ?? [])
const eventOptions = computed(() => getMaterialEventOptions(selectedNode.value.type))
const selectedEventIndex = ref(0)
const activeEvent = computed(() => events.value[selectedEventIndex.value])
const CUSTOM_EVENT_COMMAND = '__custom_event__'

watch(
  [() => selectedNode.value.id, () => events.value.length],
  () => {
    selectedEventIndex.value = Math.min(
      selectedEventIndex.value,
      Math.max(0, events.value.length - 1),
    )
  },
  { immediate: true },
)

const eventFormConfig = computed<CommonFormConfig[]>(() => [
  {
    label: '事件标题',
    field: 'title',
    component: 'input',
    props: { placeholder: '用于列表展示' },
  },
  {
    label: '事件类型',
    field: 'type',
    component: 'commonSelect',
    props: {
      options: eventOptions.value,
      filterable: true,
      allowCreate: true,
      placeholder: '选择事件类型',
    },
  },
  {
    label: '函数名称',
    field: 'name',
    component: 'input',
    props: { placeholder: '例如 onClick' },
  },
])

function createEventName(type: string) {
  const normalizedType = type.replace(/(^|[-_:])(\w)/g, (_, __, letter: string) =>
    letter.toUpperCase(),
  )
  const baseName = `on${normalizedType}`
  let candidate = baseName
  let suffix = 2
  const usedNames = new Set(events.value.map((event) => event.name))
  while (usedNames.has(candidate)) {
    candidate = `${baseName}${suffix}`
    suffix += 1
  }
  return candidate
}

function addEvent(type: string) {
  const option = eventOptions.value.find((eventOption) => eventOption.value === type)
  const newEvent: MaterialEvent = {
    title: option?.label ?? type,
    name: createEventName(type),
    type,
    code: '',
  }
  editorStore.updateNode(selectedNode.value.id, {
    ...selectedNode.value,
    events: [...events.value, newEvent],
  })
  selectedEventIndex.value = events.value.length
}

async function handleAddEvent(command: string) {
  if (command !== CUSTOM_EVENT_COMMAND) {
    addEvent(command)
    return
  }

  try {
    const { value } = await ElMessageBox.prompt(
      '请输入事件类型，例如 click 或 vnodeMounted等。',
      '添加自定义事件',
      {
        confirmButtonText: '添加',
        cancelButtonText: '取消',
        inputPlaceholder: '事件类型',
        inputValidator: (input) => input.trim().length > 0 || '请输入事件类型',
      },
    )
    addEvent(value.trim())
  } catch {
    return
  }
}

async function removeEvent(event: MaterialEvent) {
  try {
    await ElMessageBox.confirm(
      `删除“${event.title ?? event.name}”后无法恢复当前代码。`,
      '删除事件',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }
  editorStore.updateNode(selectedNode.value.id, {
    ...selectedNode.value,
    events: events.value.filter((candidate) => candidate !== event),
  })
}

function selectEvent(eventIndex: number) {
  selectedEventIndex.value = eventIndex
}

function codeLineCount(event: MaterialEvent) {
  return event.code.trim() ? event.code.split('\n').length : 0
}

function openCodeEditor() {
  if (activeEvent.value) emit('openCodeEditor', selectedEventIndex.value)
}
</script>

<template>
  <div class="event-section">
    <section class="event-list-section">
      <div class="section-heading">
        <div>
          <h3>事件</h3>
          <p>{{ events.length }} 个已配置事件</p>
        </div>
        <el-dropdown trigger="click" @command="handleAddEvent">
          <button type="button" class="add-event-button">
            <Icon icon="fluent:add-16-regular" width="16" />
            添加
          </button>
          <template #dropdown>
            <el-dropdown-item
              v-for="option in eventOptions"
              :key="option.value"
              :command="option.value"
            >
              {{ option.label }}
            </el-dropdown-item>
            <el-dropdown-item :command="CUSTOM_EVENT_COMMAND" :divided="eventOptions.length > 0">
              自定义事件类型
            </el-dropdown-item>
          </template>
        </el-dropdown>
      </div>

      <div v-if="events.length" class="event-list">
        <div
          v-for="(event, eventIndex) in events"
          :key="event.name"
          class="event-row"
          :class="{ active: eventIndex === selectedEventIndex }"
        >
          <button type="button" class="event-main" @click="selectEvent(eventIndex)">
            <span class="event-marker"></span>
            <span class="event-copy">
              <strong>{{ event.title || event.name }}</strong>
              <small
                >{{ event.type }} ·
                {{ codeLineCount(event) ? `${codeLineCount(event)} 行` : '待配置' }}</small
              >
            </span>
          </button>
          <el-dropdown trigger="click" @command="removeEvent(event)">
            <button
              type="button"
              class="more-button icon-button"
              :aria-label="`管理${event.title ?? event.name}`"
            >
              <Icon icon="fluent:more-horizontal-20-regular" width="16" />
            </button>
            <template #dropdown>
              <el-dropdown-item command="remove">删除事件</el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div v-else class="empty-state">
        <Icon icon="fluent:flash-20-regular" width="22" />
        <strong>还没有配置事件</strong>
        <span>{{
          eventOptions.length
            ? '点击添加，选择组件支持的类型或创建自定义事件'
            : '点击添加，创建自定义事件类型'
        }}</span>
      </div>
    </section>

    <section v-if="activeEvent" class="event-detail-section">
      <div class="section-heading">
        <div>
          <h3>事件设置</h3>
          <p>名称和触发类型即时生效</p>
        </div>
      </div>
      <CommonForm
        label-position="top"
        :model-value="activeEvent"
        :config="eventFormConfig"
        :command-dispatcher="dispatchCommand"
      />

      <div class="code-summary">
        <div class="code-copy">
          <span class="code-icon icon-tile"><Icon icon="fluent:code-20-regular" width="17" /></span>
          <span>
            <strong>处理代码</strong>
            <small>{{
              codeLineCount(activeEvent) ? `已配置 · ${codeLineCount(activeEvent)} 行` : '待配置'
            }}</small>
          </span>
        </div>
        <button type="button" class="open-code-button" @click="openCodeEditor">打开编辑器</button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.event-list-section,
.event-detail-section {
  padding: 16px 14px;
  border-bottom: 1px solid var(--border-color);
}

.add-event-button,
.open-code-button {
  display: inline-flex;
  height: 28px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 9px;
  border: 1px solid var(--border-color-strong);
  border-radius: 4px;
  background: var(--surface-raised);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--accent-color);
    color: var(--text-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.event-row {
  display: flex;
  min-width: 0;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 5px;
  background: var(--surface-raised);

  &:hover {
    background: var(--surface-hover);
  }

  &.active {
    border-color: color-mix(in srgb, var(--accent-color) 34%, transparent);
    background: var(--accent-soft);
  }
}

.event-main {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.event-marker {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--text-muted);

  .active & {
    background: var(--accent-color);
  }
}

.event-copy,
.code-copy > span:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;

  strong {
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 11px;
  }
}

.active .event-copy strong {
  color: var(--text-primary);
}

.more-button {
  margin-right: 5px;

  &:hover {
    background: var(--surface-workbench);
  }
}

.code-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: var(--surface-workbench);
}

.code-copy {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.open-code-button {
  flex: none;
  border-color: var(--accent-color);
  background: var(--accent-soft);
  color: var(--accent-color);
}

.empty-state {
  min-height: 150px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
