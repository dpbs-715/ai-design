<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { useConfigs } from '@vunio/hooks'
import { type CommonFormConfig, CommonSelect } from '@vunio/ui'
import MonacoEditor from '@/components/MonacoEditor/index.vue'
import { deepClone } from '@vunio/utils'
import type { MaterialEvent } from '@/schema/material.ts'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'NodeEvents',
})

const editorStore = useEditorStore()

const { selectedNode, nodes } = storeToRefs(editorStore)

const data = ref(deepClone(selectedNode.value.events || []))

const activeEvent = ref()
function selectEvent(event: MaterialEvent) {
  activeEvent.value = event
}

const { config } = useConfigs<CommonFormConfig>([
  {
    label: '标题',
    field: 'title',
  },
  {
    label: '名称',
    field: 'name',
  },
  {
    label: '类型',
    field: 'type',
  },
  {
    label: '函数体',
    field: 'code',
  },
])

function onAdd() {
  data.value.push({
    name: '未命名',
    type: '',
    code: '',
  })

  selectEvent(data.value.at(-1))
}

function removeEvent(name: string) {
  data.value = data.value.filter((item) => item.name != name)
  selectEvent(null)
}

const dispatchEvent = ref()
const dispatchOptions = computed(() => {
  return nodes.value.map((node) => {
    return {
      label: node.name,
      value: node.id,
      children: node.events?.map((child) => {
        return {
          label: child.title,
          value: child.name,
        }
      }),
    }
  })
})

async function copyNodeId(id: string) {
  await navigator.clipboard.writeText(id)
  ElMessage.success('复制成功')
}

function insertDispatchCode(values: string[]) {
  const [id, name] = values
  const code = `\n$context.dispatch('${id}','${name}')`
  activeEvent.value.code += code

  nextTick(() => {
    dispatchEvent.value = undefined
  })
}

defineExpose({
  save() {
    editorStore.updateNode(selectedNode.value.id, {
      ...selectedNode.value,
      events: data.value,
    })
  },
})
</script>

<template>
  <div class="node-event-container">
    <div class="node-event-sidebar">
      <commonButton @click="onAdd" type="primary" size="small">新增</commonButton>
      <div
        class="node-event-item"
        :class="{ active: item.name === activeEvent?.name }"
        v-for="item in data"
        :key="item.name"
        @click="selectEvent(item)"
      >
        <div class="truncate">{{ item.title }}</div>
        <span class="cursor-pointer" @click.stop="removeEvent(item.name)">
          <Icon icon="mdi:remove" />
        </span>
      </div>
    </div>
    <div class="node-event-content">
      <template v-if="activeEvent">
        <div class="flex gap-20 mb-20">
          <CommonSelect
            class="flex-1"
            placeholder="复制节点 ID"
            :options="nodes"
            value-field="id"
            label-field="name"
            @change="copyNodeId"
          />
          <el-cascader
            class="flex-1"
            v-model="dispatchEvent"
            placeholder="触发事件"
            :options="dispatchOptions"
            @change="insertDispatchCode"
          />
        </div>
        <CommonForm v-model="activeEvent" :config="config">
          <template #code>
            <div class="flex flex-col w-full bg-[#1e1e1e]">
              <div class="flex-none pl-30">
                function {{ activeEvent.name }}($context,$node,$payload){
              </div>
              <MonacoEditor class="flex-1" v-model="activeEvent.code" lang="javascript" />
              <div class="flex-none pl-30">}</div>
            </div>
          </template>
        </CommonForm>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.node-event-container {
  display: flex;
  gap: 20px;
  height: 600px;
  .node-event-sidebar {
    overflow: auto;
    width: 200px;
    flex: none;
    border: 1px solid var(--border-color);
    padding: 10px;
    .node-event-item {
      height: 40px;
      padding: 0 10px;
      background-color: bg-mix(80);
      margin: 5px 0;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      &.active {
        background: var(--el-color-primary);
      }
    }
  }
  .node-event-content {
    padding: 20px;
    flex: 1;
    border: 1px solid var(--border-color);
    overflow: auto;
  }
}
</style>
