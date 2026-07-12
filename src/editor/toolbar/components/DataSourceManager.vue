<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.ts'
import { storeToRefs } from 'pinia'
import { useConfigs } from '@vunio/hooks'
import type { CommonFormConfig } from '@vunio/ui'
import MonacoEditor from '@/components/MonacoEditor/index.vue'
import { deepClone } from '@vunio/utils'

defineOptions({
  name: 'DataSourceManager',
})

const editorStore = useEditorStore()

const { dataSources } = storeToRefs(editorStore)

const data = ref(
  deepClone(dataSources.value).map((item) => {
    return {
      ...item,
      data: item.data ? JSON.stringify(item.data, null, 2) : undefined,
      params: item.params ? JSON.stringify(item.params, null, 2) : undefined,
    }
  }),
)

const activeSource = ref()
function selectDataSource(source) {
  activeSource.value = source
}

const staticGroup = computed(() => activeSource.value?.type === 'static')
const apiGroup = computed(() => activeSource.value?.type === 'api')

const { config } = useConfigs<CommonFormConfig>([
  {
    label: '名称',
    field: 'name',
    component: 'input',
  },
  {
    label: '类型',
    field: 'type',
    component: 'radioGroup',
    props: {
      options: [
        {
          label: '静态',
          value: 'static',
        },
        {
          label: 'API',
          value: 'api',
        },
      ],
    },
  },
  {
    label: '数据',
    field: 'data',
    hidden: apiGroup,
    component: MonacoEditor,
  },
  {
    label: '请求地址',
    field: 'url',
    group: 'api',
    hidden: staticGroup,
    component: 'input',
  },
  {
    label: '轮询周期',
    field: 'interval',
    group: 'api',
    hidden: staticGroup,
    component: 'number',
  },
  {
    label: '数据',
    field: 'params',
    component: MonacoEditor,
    hidden: staticGroup,
  },
])

function onAdd() {
  data.value.push({
    id: crypto.randomUUID(),
    name: '未命名',
    type: 'static',
    data: '[]',
    params: '{}',
  })

  selectDataSource(data.value.at(-1))
}

function removeDataSource(id: string | number) {
  data.value = data.value.filter((item) => item.id != id)

  selectDataSource(null)
}

defineExpose({
  save() {
    const _data = deepClone(data.value).map((item) => {
      return {
        ...item,
        data: item.data ? JSON.parse(item.data) : undefined,
        params: item.params ? JSON.parse(item.params) : undefined,
      }
    })

    editorStore.page.dataSources = _data
  },
})
</script>

<template>
  <div class="data-source-container">
    <div class="data-source-sidebar">
      <commonButton @click="onAdd" type="primary" size="small">新增</commonButton>
      <div
        class="data-source-item"
        :class="{ active: item.id === activeSource?.id }"
        v-for="item in data"
        :key="item.id"
        @click="selectDataSource(item)"
      >
        <span>{{ item.name }}</span>
        <span class="cursor-pointer" @click.stop="removeDataSource(item.id)">
          <Icon icon="mdi:remove" />
        </span>
      </div>
    </div>
    <div class="data-source-content">
      <CommonForm v-if="activeSource" v-model="activeSource" :config="config" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-source-container {
  display: flex;
  gap: 20px;
  height: 600px;
  .data-source-sidebar {
    overflow: auto;
    width: 200px;
    flex: none;
    border: 1px solid var(--border-color);
    padding: 10px;
    .data-source-item {
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
  .data-source-content {
    padding: 20px;
    flex: 1;
    border: 1px solid var(--border-color);
    overflow: auto;
  }
}
</style>
