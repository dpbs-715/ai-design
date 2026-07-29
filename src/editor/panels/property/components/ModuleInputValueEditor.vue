<script setup lang="ts">
import { ElMessage } from 'element-plus'
import ThemeColorPicker from '@/components/ThemeColorPicker/index.vue'
import type { DataSourceSchema } from '@/schema/page.ts'
import type { ThemeColorValue } from '@/theme/renderTheme.ts'
import {
  moduleExpressionSchema,
  type ModuleInputSchema,
  type ModuleInputSourceKind,
  type ModuleInstanceInputValue,
  type ModuleExpression,
} from '@/schema/module.ts'

defineOptions({ name: 'ModuleInputValueEditor' })

const props = defineProps<{
  input: ModuleInputSchema
  dataSources: DataSourceSchema[]
}>()

const modelValue = defineModel<ModuleInstanceInputValue>()
const expressionText = ref('')
const literalJsonText = ref('')

const value = computed<ModuleInstanceInputValue>({
  get: () =>
    modelValue.value ?? {
      kind: 'literal',
      value: props.input.defaultValue ?? null,
    },
  set: (nextValue) => {
    modelValue.value = nextValue
  },
})

const sourceLabels: Record<ModuleInputSourceKind, string> = {
  literal: '固定值',
  'page-variable': '页面变量',
  'data-source': '页面数据源',
  expression: '表达式',
}

const sourceOptions = computed(() =>
  props.input.acceptedSources
    .filter((source) => source !== 'page-variable')
    .filter((source) => source !== 'data-source' || props.dataSources.length > 0)
    .map((source) => ({
      label: sourceLabels[source],
      value: source,
    })),
)

const dataSourceOptions = computed(() =>
  props.dataSources.map((source) => ({
    label: source.name,
    value: source.id,
  })),
)
const literalColorValue = computed(() =>
  value.value.kind === 'literal' ? (value.value.value as ThemeColorValue | undefined) : undefined,
)

watch(
  () => value.value,
  (nextValue) => {
    if (nextValue.kind === 'expression') {
      expressionText.value = JSON.stringify(nextValue.expression, null, 2)
    }
    if (
      nextValue.kind === 'literal' &&
      (props.input.valueType.kind === 'json' || props.input.valueType.kind === 'data')
    ) {
      literalJsonText.value = JSON.stringify(nextValue.value ?? null, null, 2)
    }
  },
  { immediate: true },
)

function createDefaultExpression(): ModuleExpression {
  return {
    kind: 'literal',
    value: props.input.defaultValue ?? null,
  }
}

function changeSourceKind(kind: ModuleInputSourceKind) {
  if (kind === 'literal') {
    value.value = {
      kind,
      value: props.input.defaultValue ?? null,
    }
    return
  }
  if (kind === 'data-source') {
    const sourceId = props.dataSources[0]?.id
    if (!sourceId) return
    value.value = {
      kind,
      sourceId,
      path: '',
    }
    return
  }
  if (kind === 'expression') {
    value.value = {
      kind,
      expression: createDefaultExpression(),
    }
  }
}

function updateLiteralValue(literalValue: unknown) {
  value.value = {
    kind: 'literal',
    value: literalValue,
  }
}

function applyLiteralJson() {
  try {
    updateLiteralValue(JSON.parse(literalJsonText.value))
    ElMessage.success('JSON 默认值已应用')
  } catch {
    ElMessage.error('请输入合法 JSON')
  }
}

function updateDataSource(sourceId: string) {
  if (value.value.kind !== 'data-source') return
  value.value = {
    ...value.value,
    sourceId,
  }
}

function updateDataPath(path: string) {
  if (value.value.kind !== 'data-source') return
  value.value = {
    ...value.value,
    path,
  }
}

function applyExpression() {
  try {
    const parsedExpression: unknown = JSON.parse(expressionText.value)
    const result = moduleExpressionSchema.safeParse(parsedExpression)
    if (!result.success) {
      ElMessage.error(result.error.issues[0]?.message ?? '表达式不合法')
      return
    }
    value.value = {
      kind: 'expression',
      expression: result.data,
    }
    ElMessage.success('表达式已应用')
  } catch {
    ElMessage.error('表达式必须是合法 JSON')
  }
}
</script>

<template>
  <div class="module-input-value-editor">
    <CommonSelect
      class="source-select"
      :model-value="value.kind"
      :options="sourceOptions"
      @change="changeSourceKind"
    />

    <template v-if="value.kind === 'literal'">
      <el-input-number
        v-if="input.valueType.kind === 'number'"
        class="value-control"
        :model-value="Number(value.value ?? 0)"
        :min="input.valueType.min"
        :max="input.valueType.max"
        :precision="input.valueType.integer ? 0 : undefined"
        controls-position="right"
        @update:model-value="updateLiteralValue"
      />
      <el-switch
        v-else-if="input.valueType.kind === 'boolean'"
        :model-value="Boolean(value.value)"
        @update:model-value="updateLiteralValue"
      />
      <ThemeColorPicker
        v-else-if="input.valueType.kind === 'color'"
        :model-value="literalColorValue"
        @update:model-value="updateLiteralValue"
      />
      <template v-else-if="input.valueType.kind === 'json' || input.valueType.kind === 'data'">
        <el-input v-model="literalJsonText" :rows="6" type="textarea" spellcheck="false" />
        <div class="expression-footer">
          <span>支持对象、数组和基础 JSON 值</span>
          <CommonButton size="small" type="normal" @click="applyLiteralJson">
            应用 JSON
          </CommonButton>
        </div>
      </template>
      <el-input
        v-else
        :model-value="String(value.value ?? '')"
        @update:model-value="updateLiteralValue"
      />
    </template>

    <template v-else-if="value.kind === 'data-source'">
      <CommonSelect
        :model-value="value.sourceId"
        :options="dataSourceOptions"
        placeholder="选择页面数据源"
        @change="updateDataSource"
      />
      <el-input
        :model-value="value.path"
        placeholder="可选：数据路径，例如 data.total"
        @update:model-value="updateDataPath"
      />
    </template>

    <template v-else-if="value.kind === 'expression'">
      <el-input v-model="expressionText" :rows="7" type="textarea" spellcheck="false" />
      <div class="expression-footer">
        <span>支持 input、literal、path、call 表达式</span>
        <CommonButton size="small" type="normal" @click="applyExpression">
          应用表达式
        </CommonButton>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.module-input-value-editor {
  display: grid;
  gap: 8px;
}

.source-select,
.value-control {
  width: 100%;
}

.expression-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  span {
    color: var(--text-muted);
    font-size: 9px;
    line-height: 1.4;
  }
}
</style>
