<script setup lang="ts">
import { deepClone } from '@vunio/utils'
import type {
  TableColumnEditorSchema,
  TableColumnLeafSchema,
  TableColumnSchema,
  TableCondition,
  TableConditionGroup,
  TableEditorComponent,
  TableEditorOption,
} from '../schema.ts'

defineOptions({ name: 'TableColumnsSetter' })

const { modelValue = [] } = defineProps<{
  modelValue?: TableColumnSchema[]
}>()

const emit = defineEmits<{
  'update:modelValue': [columns: TableColumnSchema[]]
}>()

type ConditionKey = 'editableWhen' | 'disabledWhen'

const DEFAULT_NEW_COLUMN_MIN_WIDTH = 120

const columns = ref<TableColumnSchema[]>([])
const selectedId = ref('')

watch(
  () => modelValue,
  (value) => {
    columns.value = deepClone(value)
    if (!findColumn(columns.value, selectedId.value)) {
      selectedId.value = columns.value[0]?.id ?? ''
    }
  },
  { immediate: true, deep: true },
)

const selectedColumn = computed(() => findColumn(columns.value, selectedId.value))

function findColumn(candidates: TableColumnSchema[], id: string): TableColumnSchema | undefined {
  for (const column of candidates) {
    if (column.id === id) return column
    if (column.type === 'group') {
      const nested = findColumn(column.children, id)
      if (nested) return nested
    }
  }
}

function collectFields(candidates: TableColumnSchema[], fields = new Set<string>()) {
  candidates.forEach((column) => {
    if (column.type === 'group') collectFields(column.children, fields)
    else fields.add(column.field)
  })
  return fields
}

function createUniqueField() {
  const fields = collectFields(columns.value)
  let index = fields.size + 1
  while (fields.has(`field${index}`)) index += 1
  return `field${index}`
}

function createColumn(): TableColumnLeafSchema {
  const field = createUniqueField()
  return {
    type: 'column',
    id: crypto.randomUUID(),
    field,
    label: `数据列 ${field.replace('field', '')}`,
    hidden: false,
    minWidth: DEFAULT_NEW_COLUMN_MIN_WIDTH,
    align: 'left',
    headerAlign: 'center',
    display: {
      type: 'text',
      props: {},
    },
    editor: {
      enabled: false,
      component: 'input',
      props: {
        placeholder: '',
        options: [],
        clearable: true,
      },
      rules: [],
    },
  }
}

function createGroup(): TableColumnSchema {
  return {
    type: 'group',
    id: crypto.randomUUID(),
    label: '表头分组',
    hidden: false,
    headerAlign: 'center',
    children: [],
  }
}

function selectedChildrenTarget() {
  const selected = selectedColumn.value
  return selected?.type === 'group' ? selected.children : columns.value
}

function addColumn() {
  const column = createColumn()
  selectedChildrenTarget().push(column)
  selectedId.value = column.id
  commit()
}

function addGroup() {
  const group = createGroup()
  selectedChildrenTarget().push(group)
  selectedId.value = group.id
  commit()
}

function removeColumn(candidates: TableColumnSchema[], id: string): boolean {
  const index = candidates.findIndex((column) => column.id === id)
  if (index >= 0) {
    candidates.splice(index, 1)
    return true
  }
  return candidates.some((column) => column.type === 'group' && removeColumn(column.children, id))
}

function removeSelected() {
  if (!selectedId.value) return
  removeColumn(columns.value, selectedId.value)
  selectedId.value = columns.value[0]?.id ?? ''
  commit()
}

function commit() {
  emit('update:modelValue', deepClone(columns.value))
}

function selectColumn(column: TableColumnSchema) {
  selectedId.value = column.id
}

function allowDrop(draggingNode: any, dropNode: any, type: 'prev' | 'inner' | 'next') {
  if (type !== 'inner') return true
  return dropNode.data?.type === 'group' && draggingNode.data?.id !== dropNode.data?.id
}

function onNodeDrop() {
  commit()
}

function updateSelected(field: string, value: unknown) {
  const selected = selectedColumn.value
  if (!selected) return
  ;(selected as Record<string, unknown>)[field] = value
  commit()
}

function updateColumnDimension(field: 'width' | 'minWidth', value: unknown) {
  const normalizedValue = typeof value === 'number' && Number.isFinite(value) ? value : undefined
  updateSelected(field, normalizedValue)
}

function ensureEditor(column: TableColumnLeafSchema): TableColumnEditorSchema {
  column.editor ??= {
    enabled: false,
    component: 'input',
    props: {
      placeholder: '',
      options: [],
      clearable: true,
    },
    rules: [],
  }
  return column.editor
}

function updateEditor(field: keyof TableColumnEditorSchema, value: unknown) {
  const selected = selectedColumn.value
  if (selected?.type !== 'column') return
  const editor = ensureEditor(selected)
  ;(editor as Record<string, unknown>)[field] = value
  commit()
}

function updateEditorProp(field: string, value: unknown) {
  const selected = selectedColumn.value
  if (selected?.type !== 'column') return
  ensureEditor(selected).props[field] = value
  commit()
}

function selectOptions(column: TableColumnLeafSchema) {
  return ensureEditor(column).props.options ?? (ensureEditor(column).props.options = [])
}

function addSelectOption(column: TableColumnLeafSchema) {
  const options = selectOptions(column)
  let index = options.length + 1
  const values = new Set(options.map((option) => String(option.value)))
  while (values.has(`option${index}`)) index += 1
  options.push({
    label: `选项 ${index}`,
    value: `option${index}`,
    disabled: false,
  })
  commit()
}

function updateSelectOption(
  column: TableColumnSchema,
  index: number,
  field: keyof TableEditorOption,
  value: unknown,
) {
  if (column.type !== 'column') return
  const option = selectOptions(column)[index]
  if (!option) return
  ;(option as Record<string, unknown>)[field] = value
  commit()
}

function removeSelectOption(column: TableColumnSchema, index: number) {
  if (column.type !== 'column') return
  selectOptions(column).splice(index, 1)
  commit()
}

function updateDisplay(field: string, value: unknown) {
  const selected = selectedColumn.value
  if (selected?.type !== 'column') return
  ;(selected.display as Record<string, unknown>)[field] = value
  commit()
}

function conditionGroup(key: ConditionKey) {
  const selected = selectedColumn.value
  return selected?.type === 'column' ? selected.editor?.[key] : undefined
}

function toggleConditionGroup(key: ConditionKey, enabled: boolean) {
  const selected = selectedColumn.value
  if (selected?.type !== 'column') return
  const editor = ensureEditor(selected)
  editor[key] = enabled
    ? {
        logic: 'and',
        conditions: [{ field: '$rowIndex', operator: 'greaterThan', value: -1 }],
      }
    : undefined
  commit()
}

function updateConditionLogic(key: ConditionKey, value: unknown) {
  const group = conditionGroup(key)
  if (!group || !['and', 'or'].includes(String(value))) return
  group.logic = value as TableConditionGroup['logic']
  commit()
}

function addCondition(key: ConditionKey) {
  const group = conditionGroup(key)
  if (!group) return
  group.conditions.push({
    field: '$rowIndex',
    operator: 'greaterThan',
    value: -1,
  })
  commit()
}

function removeCondition(key: ConditionKey, index: number) {
  const group = conditionGroup(key)
  if (!group) return
  group.conditions.splice(index, 1)
  commit()
}

function updateCondition(
  key: ConditionKey,
  index: number,
  field: keyof TableCondition,
  value: unknown,
) {
  const condition = conditionGroup(key)?.conditions[index]
  if (!condition) return
  ;(condition as Record<string, unknown>)[field] = value
  commit()
}

function hasRequiredRule(column: TableColumnLeafSchema) {
  return Boolean(column.editor?.rules.some((rule) => rule.type === 'required'))
}

function toggleRequired(column: TableColumnLeafSchema, required: boolean) {
  const editor = ensureEditor(column)
  editor.rules = required
    ? [
        {
          type: 'required',
          message: `${column.label || '当前字段'}不能为空`,
          trigger: ['blur', 'change'],
        },
      ]
    : []
  commit()
}

function updateRequiredMessage(column: TableColumnLeafSchema, message: string) {
  const rule = column.editor?.rules.find((candidate) => candidate.type === 'required')
  if (!rule) return
  rule.message = message
  commit()
}

const editorComponentOptions: Array<{ label: string; value: TableEditorComponent }> = [
  { label: '文本输入', value: 'input' },
  { label: '数字输入', value: 'number' },
  { label: '下拉选择', value: 'select' },
  { label: '日期选择', value: 'date' },
]

const conditionOperatorOptions = [
  { label: '等于', value: 'equals' },
  { label: '不等于', value: 'notEquals' },
  { label: '大于', value: 'greaterThan' },
  { label: '小于', value: 'lessThan' },
  { label: '包含', value: 'contains' },
  { label: '为真', value: 'truthy' },
  { label: '为假', value: 'falsy' },
]

function needsConditionValue(operator: TableCondition['operator']) {
  return !['truthy', 'falsy'].includes(operator)
}

function formatConditionValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? value : String(value ?? '')
}

function parseConditionValue(value: string) {
  const normalized = value.trim()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  if (normalized === 'null') return null
  if (normalized !== '' && Number.isFinite(Number(normalized))) return Number(normalized)
  return value
}
</script>

<template>
  <div class="table-columns-setter">
    <div class="column-actions">
      <CommonButton size="small" @click="addColumn">
        <Icon icon="fluent:add-16-regular" width="15" />
        添加列
      </CommonButton>
      <CommonButton size="small" @click="addGroup">
        <Icon icon="fluent:group-list-20-regular" width="15" />
        添加分组
      </CommonButton>
    </div>

    <div v-if="columns.length" class="column-tree">
      <el-tree
        :data="columns"
        node-key="id"
        default-expand-all
        draggable
        :expand-on-click-node="false"
        :allow-drop="allowDrop"
        @node-click="selectColumn"
        @node-drop="onNodeDrop"
      >
        <template #default="{ data }">
          <span class="column-node" :class="{ active: data.id === selectedId, muted: data.hidden }">
            <Icon
              :icon="
                data.type === 'group'
                  ? 'fluent:group-list-20-regular'
                  : 'fluent:column-triple-20-regular'
              "
              width="15"
            />
            <span>{{ data.label || '未命名列' }}</span>
            <small>{{ data.type === 'group' ? '分组' : data.field }}</small>
          </span>
        </template>
      </el-tree>
    </div>
    <div v-else class="column-empty">添加数据列或表头分组</div>

    <section v-if="selectedColumn" class="column-detail">
      <div class="detail-heading">
        <div class="detail-heading-copy">
          <strong>{{ selectedColumn.type === 'group' ? '分组表头' : '数据列' }}</strong>
          <span>{{ selectedColumn.id.slice(0, 8) }}</span>
        </div>
        <button
          type="button"
          class="column-remove icon-button icon-button--sm"
          :aria-label="`删除${selectedColumn.type === 'group' ? '分组' : '列'} ${selectedColumn.label}`"
          @click="removeSelected"
        >
          <Icon icon="fluent:delete-16-regular" width="15" />
        </button>
      </div>

      <label class="detail-field">
        <span>标题</span>
        <el-input
          :model-value="selectedColumn.label"
          @update:model-value="updateSelected('label', $event)"
        />
      </label>

      <label v-if="selectedColumn.type === 'column'" class="detail-field">
        <span>字段名</span>
        <el-input
          :model-value="selectedColumn.field"
          @update:model-value="updateSelected('field', $event)"
        />
      </label>

      <div class="detail-grid">
        <label class="detail-field">
          <span>表头对齐</span>
          <el-select
            :model-value="selectedColumn.headerAlign"
            @update:model-value="updateSelected('headerAlign', $event)"
          >
            <el-option label="左对齐" value="left" />
            <el-option label="居中" value="center" />
            <el-option label="右对齐" value="right" />
          </el-select>
        </label>
        <div class="detail-field detail-switch-field">
          <span>隐藏</span>
          <el-switch
            :model-value="selectedColumn.hidden"
            @update:model-value="updateSelected('hidden', Boolean($event))"
          />
        </div>
      </div>

      <template v-if="selectedColumn.type === 'column'">
        <div class="detail-grid">
          <label class="detail-field">
            <span>内容对齐</span>
            <el-select
              :model-value="selectedColumn.align"
              @update:model-value="updateSelected('align', $event)"
            >
              <el-option label="左对齐" value="left" />
              <el-option label="居中" value="center" />
              <el-option label="右对齐" value="right" />
            </el-select>
          </label>
          <label class="detail-field">
            <span>展示类型</span>
            <el-select
              :model-value="selectedColumn.display.type"
              @update:model-value="updateDisplay('type', $event)"
            >
              <el-option label="文本" value="text" />
              <el-option label="数值" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="标签" value="tag" />
            </el-select>
          </label>
        </div>

        <div class="detail-grid">
          <label class="detail-field">
            <span>列宽</span>
            <el-input-number
              :model-value="selectedColumn.width"
              :min="40"
              controls-position="right"
              @update:model-value="updateColumnDimension('width', $event)"
            />
          </label>
          <label class="detail-field">
            <span>最小列宽</span>
            <el-input-number
              :model-value="selectedColumn.minWidth"
              :min="40"
              controls-position="right"
              @update:model-value="updateColumnDimension('minWidth', $event)"
            />
          </label>
        </div>

        <div class="detail-switch detail-section-heading">
          <strong>单元格编辑</strong>
          <el-switch
            :model-value="selectedColumn.editor?.enabled ?? false"
            @update:model-value="updateEditor('enabled', Boolean($event))"
          />
        </div>

        <template v-if="selectedColumn.editor?.enabled">
          <label class="detail-field">
            <span>编辑组件</span>
            <el-select
              :model-value="selectedColumn.editor.component"
              @update:model-value="updateEditor('component', $event)"
            >
              <el-option
                v-for="option in editorComponentOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </label>
          <label class="detail-field">
            <span>占位提示</span>
            <el-input
              :model-value="selectedColumn.editor.props.placeholder"
              @update:model-value="updateEditorProp('placeholder', $event)"
            />
          </label>

          <section v-if="selectedColumn.editor.component === 'select'" class="condition-section">
            <div class="condition-toolbar">
              <strong>选择项</strong>
              <button type="button" @click="addSelectOption(selectedColumn)">添加选项</button>
            </div>
            <div
              v-for="(option, index) in selectedColumn.editor.props.options ?? []"
              :key="index"
              class="select-option-row"
            >
              <el-input
                :model-value="option.label"
                placeholder="显示文字"
                @update:model-value="updateSelectOption(selectedColumn, index, 'label', $event)"
              />
              <el-input
                :model-value="String(option.value)"
                placeholder="选项值"
                @update:model-value="updateSelectOption(selectedColumn, index, 'value', $event)"
              />
              <el-switch
                :model-value="option.disabled ?? false"
                title="禁用选项"
                @update:model-value="
                  updateSelectOption(selectedColumn, index, 'disabled', Boolean($event))
                "
              />
              <button
                type="button"
                class="condition-remove"
                aria-label="删除选项"
                @click="removeSelectOption(selectedColumn, index)"
              >
                <Icon icon="fluent:delete-16-regular" width="15" />
              </button>
            </div>
            <div v-if="!(selectedColumn.editor.props.options ?? []).length" class="column-empty">
              暂无选择项
            </div>
          </section>

          <div class="detail-switch">
            <span>必填校验</span>
            <el-switch
              :model-value="hasRequiredRule(selectedColumn)"
              @update:model-value="toggleRequired(selectedColumn, Boolean($event))"
            />
          </div>
          <label v-if="hasRequiredRule(selectedColumn)" class="detail-field">
            <span>校验提示</span>
            <el-input
              :model-value="selectedColumn.editor.rules[0]?.message"
              @update:model-value="updateRequiredMessage(selectedColumn, $event)"
            />
          </label>

          <section
            v-for="conditionKey in ['editableWhen', 'disabledWhen'] as const"
            :key="conditionKey"
            class="condition-section"
          >
            <div class="detail-switch">
              <span>{{ conditionKey === 'editableWhen' ? '可编辑条件' : '禁用条件' }}</span>
              <el-switch
                :model-value="Boolean(conditionGroup(conditionKey))"
                @update:model-value="toggleConditionGroup(conditionKey, Boolean($event))"
              />
            </div>

            <template v-if="conditionGroup(conditionKey)">
              <div class="condition-toolbar">
                <el-radio-group
                  :model-value="conditionGroup(conditionKey)?.logic"
                  size="small"
                  @update:model-value="updateConditionLogic(conditionKey, $event)"
                >
                  <el-radio-button value="and">全部满足</el-radio-button>
                  <el-radio-button value="or">任一满足</el-radio-button>
                </el-radio-group>
                <button type="button" @click="addCondition(conditionKey)">添加条件</button>
              </div>

              <div
                v-for="(condition, index) in conditionGroup(conditionKey)?.conditions"
                :key="index"
                class="condition-row"
              >
                <el-input
                  class="condition-field"
                  :model-value="condition.field"
                  placeholder="字段或 $rowIndex"
                  @update:model-value="updateCondition(conditionKey, index, 'field', $event)"
                />
                <el-select
                  class="condition-operator"
                  :model-value="condition.operator"
                  @update:model-value="updateCondition(conditionKey, index, 'operator', $event)"
                >
                  <el-option
                    v-for="option in conditionOperatorOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-input
                  v-if="needsConditionValue(condition.operator)"
                  class="condition-value"
                  :model-value="formatConditionValue(condition.value)"
                  placeholder="比较值"
                  @update:model-value="
                    updateCondition(conditionKey, index, 'value', parseConditionValue($event))
                  "
                />
                <button
                  type="button"
                  class="condition-remove"
                  aria-label="删除条件"
                  @click="removeCondition(conditionKey, index)"
                >
                  <Icon icon="fluent:delete-16-regular" width="15" />
                </button>
              </div>
            </template>
          </section>
        </template>
      </template>
    </section>
  </div>
</template>

<style scoped>
.table-columns-setter {
  display: grid;
  min-width: 0;
  width: 100%;
  gap: 10px;
}

.column-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.column-tree {
  max-height: 220px;
  padding: 6px;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-raised);
}

.column-tree :deep(.el-tree) {
  background: transparent;
  color: var(--text-secondary);
}

.column-node {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 6px;
}

.column-node > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-node small {
  margin-left: auto;
  color: var(--text-muted);
}

.column-node.active {
  color: var(--accent-color);
}

.column-node.muted {
  opacity: 0.55;
}

.column-empty {
  padding: 20px 12px;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  color: var(--text-muted);
  text-align: center;
}

.column-detail {
  display: grid;
  min-width: 0;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.detail-heading,
.detail-switch,
.condition-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.detail-heading-copy {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}

.detail-heading-copy span {
  color: var(--text-muted);
  font-size: 11px;
}

.column-remove:hover,
.column-remove:focus-visible {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.column-remove:focus-visible {
  outline: 2px solid var(--el-color-danger-light-5);
  outline-offset: 1px;
}

.detail-field {
  display: grid;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-grid :deep(.el-input-number) {
  width: 100%;
}

.detail-switch-field :deep(.el-switch) {
  justify-self: start;
}

.detail-section-heading {
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.condition-section {
  box-sizing: border-box;
  display: grid;
  min-width: 0;
  width: 100%;
  gap: 8px;
  padding: 9px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-raised);
}

.condition-toolbar button,
.condition-remove {
  border: 0;
  background: transparent;
  color: var(--accent-color);
  cursor: pointer;
  font-size: 12px;
}

.condition-row {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) minmax(84px, 0.8fr) 24px;
  gap: 5px;
}

.condition-field,
.condition-operator,
.condition-value {
  min-width: 0;
}

.condition-value {
  grid-column: 1 / 3;
}

.select-option-row {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(80px, 1fr) minmax(80px, 1fr) auto 24px;
  align-items: center;
  gap: 5px;
}

.condition-remove {
  display: grid;
  place-items: center;
  color: var(--el-color-danger);
}
</style>
