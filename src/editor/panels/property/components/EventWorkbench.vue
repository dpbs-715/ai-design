<script setup lang="ts">
import { CommonSelect } from '@vunio/ui'
import { deepClone } from '@vunio/utils'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import MonacoEditor from '@/components/MonacoEditor/index.vue'
import { createEventScriptExtraLib } from '@/editor/panels/property/eventScriptTypes.ts'
import { getMaterialEventOptions } from '@/materials'
import type { MaterialEvent, MaterialSchema } from '@/schema/material.ts'
import { useEditorStore } from '@/stores/editor.ts'
import { writeClipboardText } from '@/utils/clipboard.ts'

defineOptions({ name: 'EventWorkbench' })

const { event, node } = defineProps<{
  event: MaterialEvent
  node: MaterialSchema
}>()

const editorStore = useEditorStore()
const { nodes } = storeToRefs(editorStore)
const draft = ref<MaterialEvent>(deepClone(event))
const dispatchTarget = ref<(string | number)[]>()

const dispatchOptions = computed(() =>
  nodes.value.map((node) => {
    const children = node.events?.map((nodeEvent) => ({
      label: nodeEvent.title ?? nodeEvent.name,
      value: nodeEvent.name,
    }))
    return {
      label: node.name,
      value: node.id,
      ...(children?.length ? { children } : {}),
    }
  }),
)

const functionSignature = computed(() => `function ${draft.value.name}($context, $node, $payload)`)
const eventExtraLibs = computed(() => {
  const eventOption = getMaterialEventOptions(node.type).find(
    (option) => option.value === draft.value.type,
  )
  return [createEventScriptExtraLib(eventOption?.payloadType)]
})

async function copyNodeId(id: string) {
  try {
    await writeClipboardText(id)
    ElMessage.success('节点 ID 已复制')
  } catch {
    ElMessage.error('复制失败，请检查浏览器剪贴板权限')
  }
}

function insertDispatchCode(value: unknown) {
  if (!Array.isArray(value) || value.length < 2) return
  const [nodeId, eventName] = value
  const statement = `$context.dispatch('${String(nodeId)}', '${String(eventName)}')`
  const separator = draft.value.code && !draft.value.code.endsWith('\n') ? '\n' : ''
  draft.value.code += `${separator}${statement}`
  nextTick(() => {
    dispatchTarget.value = undefined
  })
}

function getDraft() {
  return deepClone(draft.value)
}

defineExpose({ getDraft })
</script>

<template>
  <div class="event-workbench">
    <header class="workbench-header">
      <div>
        <span class="eyebrow">事件代码</span>
        <h3>{{ event.title ?? event.name }}</h3>
        <code>{{ functionSignature }}</code>
      </div>
      <span class="event-type">{{ event.type }}</span>
    </header>

    <div class="insert-toolbar">
      <div class="toolbar-copy">
        <strong>插入辅助</strong>
        <span>快速引用画布中的节点和事件</span>
      </div>
      <div class="toolbar-controls">
        <CommonSelect
          class="helper-select"
          placeholder="引用节点"
          :options="nodes"
          value-field="id"
          label-field="name"
          @change="copyNodeId"
        />
        <el-cascader
          v-model="dispatchTarget"
          class="helper-select"
          placement="left"
          placeholder="触发组件事件"
          :options="dispatchOptions"
          @change="insertDispatchCode"
        />
      </div>
    </div>

    <div class="code-editor">
      <div class="function-line">{{ functionSignature }} {</div>
      <MonacoEditor
        v-model="draft.code"
        class="monaco"
        lang="javascript"
        :extra-libs="eventExtraLibs"
      />
      <div class="function-line">}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.event-workbench {
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 14px;
}

.workbench-header {
  display: flex;
  flex: none;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 2px 0 14px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 3px 0 6px;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 500;
  }

  code {
    color: var(--text-muted);
    font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
    font-size: 12px;
  }
}

.eyebrow {
  color: var(--accent-color);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.event-type {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--surface-raised);
  color: var(--text-secondary);
  font-size: 11px;
}

.insert-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: var(--surface-raised);
}

.toolbar-copy {
  display: flex;
  min-width: 130px;
  flex-direction: column;

  strong {
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 500;
  }

  span {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 11px;
  }
}

.toolbar-controls {
  display: flex;
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
  gap: 8px;
}

.helper-select {
  width: min(220px, 48%);
}

.code-editor {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: var(--surface-workbench);
}

.function-line {
  flex: none;
  padding: 9px 14px;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 12px;
}

.monaco {
  min-height: 0;
  flex: 1;
}
</style>
