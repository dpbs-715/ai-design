<script setup lang="ts">
import { useConfigs } from '@vunio/hooks'
import { SetFormFieldCommand, type CommonFormConfig } from '@vunio/ui'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor.ts'
import { useUndoRedo } from '@/hooks/useUndoRedo.ts'
import {
  getModuleEditorContract,
  getModuleEditorWiring,
  type ModuleContractSchema,
  type ModuleInputSchema,
  type ModuleValueBindingSchema,
  type ModuleValueType,
  type ModuleWiringSchema,
} from '@/schema/module.ts'

defineOptions({ name: 'ModuleContractSection' })

type EditableModuleValueType = Extract<
  ModuleValueType['kind'],
  'string' | 'number' | 'boolean' | 'color' | 'json' | 'data'
>

interface InputDraft {
  id: string
  key: string
  label: string
  valueType: EditableModuleValueType
  defaultValue: unknown
}

interface BindingDraft {
  inputId: string
  nodeId: string
  path: string
}

const editorStore = useEditorStore()
const { page, nodes, root } = storeToRefs(editorStore)
const { dispatchCommand, startBatch, commitBatch } = useUndoRedo()

const contract = computed(() => getModuleEditorContract(page.value))
const wiring = computed(() => getModuleEditorWiring(page.value))
const inputDialogVisible = ref(false)
const bindingDialogVisible = ref(false)
const editingInputId = ref('')
const inputDraft = ref<InputDraft>(createInputDraft())
const bindingDraft = ref<BindingDraft>({
  inputId: '',
  nodeId: '',
  path: 'props.content',
})

const valueTypeOptions = [
  { label: '文本', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '开关', value: 'boolean' },
  { label: '颜色', value: 'color' },
  { label: 'JSON', value: 'json' },
  { label: '数据对象', value: 'data' },
]

const nodeOptions = computed(() => [
  { label: `${root.value.name}（模块根）`, value: root.value.id },
  ...nodes.value.map((node) => ({ label: node.name, value: node.id })),
])

const inputFormConfigs = computed<CommonFormConfig[]>(() => [
  {
    label: '显示名称',
    field: 'label',
    component: 'input',
    props: { placeholder: '例如：标题' },
  },
  {
    label: '参数 Key',
    field: 'key',
    component: 'input',
    props: { placeholder: '例如：title' },
  },
  {
    label: '数据类型',
    field: 'valueType',
    component: 'commonSelect',
    props: { options: valueTypeOptions },
  },
  {
    label: '默认值',
    field: 'defaultValue',
    component:
      inputDraft.value.valueType === 'number'
        ? 'number'
        : inputDraft.value.valueType === 'boolean'
          ? 'switch'
          : inputDraft.value.valueType === 'color'
            ? 'themeColor'
            : 'input',
    props:
      inputDraft.value.valueType === 'json' || inputDraft.value.valueType === 'data'
        ? { type: 'textarea', rows: 6, spellcheck: false }
        : undefined,
  },
])
const [inputFormConfig] = useConfigs<CommonFormConfig>(inputFormConfigs, false)

const bindingFormConfigs = computed<CommonFormConfig[]>(() => [
  {
    label: '内部节点',
    field: 'nodeId',
    component: 'commonSelect',
    props: {
      options: nodeOptions.value,
      filterable: true,
      placeholder: '选择绑定目标',
    },
  },
  {
    label: '字段路径',
    field: 'path',
    component: 'input',
    props: { placeholder: '例如：props.content' },
  },
])
const [bindingFormConfig] = useConfigs<CommonFormConfig>(bindingFormConfigs, false)

function createInputDraft(input?: ModuleInputSchema): InputDraft {
  const valueType = input?.valueType.kind
  return {
    id: input?.id ?? crypto.randomUUID(),
    key: input?.key ?? '',
    label: input?.label ?? '',
    valueType:
      valueType === 'number' ||
      valueType === 'boolean' ||
      valueType === 'color' ||
      valueType === 'json' ||
      valueType === 'data' ||
      valueType === 'string'
        ? valueType
        : 'string',
    defaultValue:
      valueType === 'json' || valueType === 'data'
        ? JSON.stringify(input?.defaultValue ?? null, null, 2)
        : (input?.defaultValue ?? ''),
  }
}

function getBindings(inputId: string) {
  return wiring.value.values.filter(
    (binding) => binding.expression.kind === 'input' && binding.expression.inputId === inputId,
  )
}

function getNodeName(nodeId: string) {
  return nodeOptions.value.find((option) => option.value === nodeId)?.label ?? nodeId
}

function commitModuleContract(nextContract: ModuleContractSchema, nextWiring: ModuleWiringSchema) {
  startBatch()
  try {
    dispatchCommand(new SetFormFieldCommand(() => page.value, 'contract', nextContract))
    dispatchCommand(new SetFormFieldCommand(() => page.value, 'wiring', nextWiring))
  } finally {
    commitBatch()
  }
}

function openCreateInput() {
  editingInputId.value = ''
  inputDraft.value = createInputDraft()
  inputDialogVisible.value = true
}

function openEditInput(input: ModuleInputSchema) {
  editingInputId.value = input.id
  inputDraft.value = createInputDraft(input)
  inputDialogVisible.value = true
}

function saveInput(close: () => void) {
  const label = inputDraft.value.label.trim()
  const key = inputDraft.value.key.trim()
  if (!label || !key) {
    ElMessage.warning('请输入参数名称和 Key')
    return
  }
  if (
    contract.value.inputs.some((input) => input.key === key && input.id !== editingInputId.value)
  ) {
    ElMessage.warning(`参数 Key “${key}” 已存在`)
    return
  }

  let defaultValue = inputDraft.value.defaultValue
  if (inputDraft.value.valueType === 'number') {
    defaultValue = Number(defaultValue)
    if (!Number.isFinite(defaultValue)) {
      ElMessage.warning('默认值必须是有效数字')
      return
    }
  } else if (inputDraft.value.valueType === 'boolean') {
    defaultValue = Boolean(defaultValue)
  } else if (inputDraft.value.valueType === 'json' || inputDraft.value.valueType === 'data') {
    try {
      defaultValue = JSON.parse(String(defaultValue))
    } catch {
      ElMessage.warning('默认值必须是合法 JSON')
      return
    }
  } else if (inputDraft.value.valueType === 'string') {
    defaultValue = String(defaultValue ?? '')
  }

  const nextInput: ModuleInputSchema = {
    id: inputDraft.value.id,
    key,
    label,
    valueType:
      inputDraft.value.valueType === 'number'
        ? { kind: 'number' }
        : { kind: inputDraft.value.valueType },
    acceptedSources: ['literal', 'data-source', 'expression'],
    defaultValue,
  }
  const nextInputs = editingInputId.value
    ? contract.value.inputs.map((input) => (input.id === editingInputId.value ? nextInput : input))
    : [...contract.value.inputs, nextInput]
  commitModuleContract({ ...contract.value, inputs: nextInputs }, wiring.value)
  close()
}

function removeInput(input: ModuleInputSchema) {
  const inputBindingIds = new Set(getBindings(input.id).map((binding) => binding.id))
  commitModuleContract(
    {
      ...contract.value,
      inputs: contract.value.inputs.filter((candidate) => candidate.id !== input.id),
    },
    {
      ...wiring.value,
      values: wiring.value.values.filter((binding) => !inputBindingIds.has(binding.id)),
    },
  )
}

function openCreateBinding(input: ModuleInputSchema) {
  bindingDraft.value = {
    inputId: input.id,
    nodeId: nodes.value[0]?.id ?? root.value.id,
    path: 'props.content',
  }
  bindingDialogVisible.value = true
}

function saveBinding(close: () => void) {
  const path = bindingDraft.value.path.trim()
  if (!bindingDraft.value.nodeId || !path) {
    ElMessage.warning('请选择节点并填写字段路径')
    return
  }
  const binding: ModuleValueBindingSchema = {
    id: crypto.randomUUID(),
    target: {
      nodeId: bindingDraft.value.nodeId,
      path,
    },
    expression: {
      kind: 'input',
      inputId: bindingDraft.value.inputId,
    },
  }
  commitModuleContract(contract.value, {
    ...wiring.value,
    values: [...wiring.value.values, binding],
  })
  close()
}

function removeBinding(bindingId: string) {
  commitModuleContract(contract.value, {
    ...wiring.value,
    values: wiring.value.values.filter((binding) => binding.id !== bindingId),
  })
}
</script>

<template>
  <section class="module-contract-section">
    <header>
      <div>
        <h3>模块输入</h3>
        <p>声明页面可配置的输入，并绑定到模块内部字段。</p>
      </div>
      <CommonButton size="small" type="primary" @click="openCreateInput"> 添加输入 </CommonButton>
    </header>

    <div v-if="contract.inputs.length" class="input-list">
      <article v-for="input in contract.inputs" :key="input.id">
        <div class="input-heading">
          <div>
            <strong>{{ input.label }}</strong>
            <code>{{ input.key }}</code>
          </div>
          <span>{{ input.valueType.kind }}</span>
        </div>

        <div v-if="getBindings(input.id).length" class="binding-list">
          <div v-for="binding in getBindings(input.id)" :key="binding.id">
            <span>{{ getNodeName(binding.target.nodeId) }}</span>
            <code>{{ binding.target.path }}</code>
            <button type="button" aria-label="删除绑定" @click="removeBinding(binding.id)">
              <Icon icon="fluent:dismiss-16-regular" width="13" />
            </button>
          </div>
        </div>
        <p v-else>尚未绑定内部字段</p>

        <footer>
          <button type="button" @click="openCreateBinding(input)">添加绑定</button>
          <button type="button" @click="openEditInput(input)">编辑</button>
          <button type="button" class="danger" @click="removeInput(input)">删除</button>
        </footer>
      </article>
    </div>
    <div v-else class="empty-inputs">模块还没有对外输入，页面实例将完全使用模块默认内容。</div>
  </section>

  <CommonDialog
    v-model="inputDialogVisible"
    destroy-on-close
    width="460px"
    :title="editingInputId ? '编辑模块输入' : '添加模块输入'"
    @confirm="saveInput"
  >
    <CommonForm v-model="inputDraft" label-position="top" :config="inputFormConfig" />
  </CommonDialog>

  <CommonDialog
    v-model="bindingDialogVisible"
    destroy-on-close
    width="460px"
    title="添加字段绑定"
    @confirm="saveBinding"
  >
    <CommonForm v-model="bindingDraft" label-position="top" :config="bindingFormConfig" />
  </CommonDialog>
</template>

<style scoped lang="scss">
.module-contract-section {
  margin: 0 14px 18px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--accent-color) 24%, var(--border-color));
  border-radius: 8px;
  background: var(--accent-soft);

  > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;

    h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 12px;
    }

    p {
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 9px;
      line-height: 1.5;
    }
  }
}

.input-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;

  article {
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface-panel);

    > p {
      margin: 8px 0 0;
      color: var(--text-muted);
      font-size: 9px;
    }

    > footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 9px;

      button {
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--accent-color);
        cursor: pointer;
        font-size: 9px;

        &.danger {
          color: var(--danger-color, #ef4444);
        }
      }
    }
  }
}

.input-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  > div {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 6px;
  }

  strong {
    color: var(--text-primary);
    font-size: 10px;
  }

  code,
  > span {
    color: var(--text-muted);
    font-size: 8px;
  }
}

.binding-list {
  display: grid;
  gap: 5px;
  margin-top: 8px;

  > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
    align-items: center;
    gap: 6px;
    padding: 5px 6px;
    border-radius: 4px;
    background: var(--surface-raised);
    color: var(--text-secondary);
    font-size: 8px;

    span,
    code {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    button {
      display: grid;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
    }
  }
}

.empty-inputs {
  margin-top: 12px;
  padding: 12px;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 9px;
  line-height: 1.6;
  text-align: center;
}
</style>
