<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { useConfigs } from '@vunio/hooks'
import type { CommonFormConfig } from '@vunio/ui'
import MonacoEditor from '@/components/MonacoEditor/index.vue'
import { deepClone } from '@vunio/utils'
import type { MaterialEvent } from '@/schema/material.ts'

defineOptions({
  name: 'NodeEvents',
})

const editorStore = useEditorStore()

const { selectedNode } = storeToRefs(editorStore)

const data = ref(deepClone(selectedNode.value.events || []))

const activeEvent = ref()
function selectEvent(event: MaterialEvent) {
  activeEvent.value = event
}

const { config } = useConfigs<CommonFormConfig>([
  {
    label: '名称',
    field: 'name',
    component: 'input',
  },
  {
    label: '类型',
    field: 'type',
    component: 'input',
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
        <span>{{ item.name }}</span>
        <span class="cursor-pointer" @click.stop="removeEvent(item.name)">
          <Icon icon="mdi:remove" />
        </span>
      </div>
    </div>
    <div class="node-event-content">
      <CommonForm v-if="activeEvent" v-model="activeEvent" :config="config">
        <template #code>
          <div class="flex flex-col w-full bg-[#1e1e1e]">
            <div class="flex-none pl-30">function ($context,$node){</div>
            <MonacoEditor class="flex-1" v-model="activeEvent.code" lang="javascript" />
            <div class="flex-none pl-30">}</div>
          </div>
        </template>
      </CommonForm>
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
