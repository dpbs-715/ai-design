import type { MaterialExposedMethod } from './descriptor.js'

/**
 * 各物料通过 `defineExpose` 暴露给事件脚本的方法。
 *
 * 这里是「有哪些方法」的唯一数据源:描述符从这里取 `exposedMethods`,
 * agent 的 `get_material_detail` 据此告诉模型能调什么,web 侧则用编译期断言
 * 保证与 .vue 里 `defineExpose` 的 Expose interface 完全一致。
 *
 * 只收录事件脚本真正用得上的方法。config 管理类方法(setHidden / setDisabled /
 * setPropsByField 等)按字段操作表单项与表格列,同样从这里暴露 —— 它们是
 * 「点某个按钮后禁用某个字段」这类联动的唯一手段。
 */

const DIALOG_METHODS = [
  { name: 'open', signature: 'open(): void', description: '打开弹窗。' },
  { name: 'close', signature: 'close(): void', description: '关闭弹窗。' },
  {
    name: 'toggle',
    signature: 'toggle(): void',
    description: '在打开与关闭之间切换。',
  },
] as const satisfies readonly MaterialExposedMethod[]

const CHART_METHODS = [
  {
    name: 'refresh',
    signature: 'refresh(): Promise<void>',
    description: '重新拉取数据源并重绘图表。',
  },
] as const satisfies readonly MaterialExposedMethod[]

const FORM_ITEM_METHODS = [
  {
    name: 'refresh',
    signature: 'refresh(params?: Record<string, unknown>): Promise<void>',
    description: '重新拉取该表单项的选项数据,可传动态查询参数。',
  },
] as const satisfies readonly MaterialExposedMethod[]

const BUSINESS_FORM_METHODS = [
  {
    name: 'validate',
    signature: 'validate(): Promise<void>',
    description: '校验整个表单,不通过时 Promise 走 reject。',
  },
  {
    name: 'submit',
    signature: 'submit(): Promise<Record<string, unknown>>',
    description: '校验并提交,返回全部字段值。校验失败不会提交。',
  },
  {
    name: 'getValues',
    signature: 'getValues(): Record<string, unknown>',
    description: '取当前全部字段值,不做校验。',
  },
  {
    name: 'setValue',
    signature: 'setValue(field: string, value: unknown): void',
    description: '按字段名设置单个字段的值。',
  },
  {
    name: 'setValues',
    signature: 'setValues(values: Record<string, unknown>): void',
    description: '批量设置字段值,未出现的字段保持原值。',
  },
  {
    name: 'resetFields',
    signature: 'resetFields(): void',
    description: '重置为初始值并清空校验状态。',
  },
  {
    name: 'clearValidate',
    signature: 'clearValidate(fields?: string[]): void',
    description: '只清校验提示,不改值。不传字段则清全部。',
  },
  {
    name: 'refresh',
    signature: 'refresh(): Promise<void>',
    description: '重新拉取表单绑定的数据源。',
  },
] as const satisfies readonly MaterialExposedMethod[]

/**
 * 表单与表格共用的按字段配置方法,来自 `useConfigs`(@vunio/hooks)。
 *
 * 签名必须与 useConfigs 的实现逐字一致 —— web 侧的编译期断言只比对方法名,
 * 签名写错(比如 fields 写成单个 string)不会报错,模型照文档调用,到运行时才炸。
 */
const FIELD_CONFIG_METHODS = [
  {
    name: 'setHidden',
    signature: 'setHidden(fields: string[], hidden: boolean): void',
    description: '按字段名显示或隐藏;只改一个字段也要传数组,如 ["age"]。',
  },
  {
    name: 'setDisabled',
    signature: 'setDisabled(fields: string[], disabled: boolean): void',
    description: '按字段名禁用或启用;只改一个字段也要传数组,如 ["age"]。',
  },
  {
    name: 'setDisabledAll',
    signature: 'setDisabledAll(disabled: boolean): void',
    description: '一次性禁用或启用全部项。',
  },
  {
    name: 'setPropsByField',
    signature: 'setPropsByField(field: string, props: Record<string, unknown>): void',
    description: '按字段名覆盖某一项的 props。',
  },
  {
    name: 'getConfigByField',
    signature: 'getConfigByField(field: string): Record<string, unknown>',
    description: '读取某一项当前的运行时配置;字段不存在时返回空对象,不是 undefined。',
  },
] as const satisfies readonly MaterialExposedMethod[]

const DATA_TABLE_METHODS = [
  {
    name: 'validate',
    signature: 'validate(): Promise<void>',
    description: '校验可编辑单元格,不通过时 Promise 走 reject。',
  },
  {
    name: 'getValue',
    signature: 'getValue(): Record<string, unknown>[]',
    description: '取当前全部行,等同 getRows。',
  },
  {
    name: 'getRows',
    signature: 'getRows(): Record<string, unknown>[]',
    description: '取当前全部行数据。',
  },
  {
    name: 'getChanges',
    signature: 'getChanges(): { added: unknown[]; updated: unknown[]; removed: unknown[] }',
    description: '取自上次 acceptChanges 以来的增删改。',
  },
  {
    name: 'isDirty',
    signature: 'isDirty(): boolean',
    description: '判断是否有未提交的改动。',
  },
  { name: 'reset', signature: 'reset(): void', description: '丢弃改动,回到上次接受的状态。' },
  {
    name: 'acceptChanges',
    signature: 'acceptChanges(): void',
    description: '把当前数据标记为已保存,清空 getChanges 的结果。',
  },
  {
    name: 'setRows',
    signature: 'setRows(rows: Record<string, unknown>[]): void',
    description: '整体替换表格数据。',
  },
  {
    name: 'addRow',
    signature: 'addRow(row?: Record<string, unknown>): void',
    description: '追加一行,不传则加空行。',
  },
  {
    name: 'removeRow',
    signature: 'removeRow(rowKey: string | number): void',
    description: '按行 key 删除一行。',
  },
  {
    name: 'moveRow',
    signature: 'moveRow(fromIndex: number, toIndex: number): void',
    description: '把某一行移动到新位置。',
  },
  {
    name: 'refresh',
    signature: 'refresh(): Promise<void>',
    description: '重新拉取表格绑定的数据源。',
  },
] as const satisfies readonly MaterialExposedMethod[]

export const dialogExposedMethods: readonly MaterialExposedMethod[] = DIALOG_METHODS
export const chartExposedMethods: readonly MaterialExposedMethod[] = CHART_METHODS
export const formItemExposedMethods: readonly MaterialExposedMethod[] = FORM_ITEM_METHODS
export const businessFormExposedMethods: readonly MaterialExposedMethod[] = [
  ...BUSINESS_FORM_METHODS,
  ...FIELD_CONFIG_METHODS,
]
export const dataTableExposedMethods: readonly MaterialExposedMethod[] = [
  ...DATA_TABLE_METHODS,
  ...FIELD_CONFIG_METHODS,
]

/**
 * 方法名集合,供 web 侧编译期断言比对 .vue 的 Expose interface。
 * 用 `typeof` 从上面的常量取字面量,避免再手抄一份名字。
 */
export type DialogMethodName = (typeof DIALOG_METHODS)[number]['name']
export type ChartMethodName = (typeof CHART_METHODS)[number]['name']
export type FormItemMethodName = (typeof FORM_ITEM_METHODS)[number]['name']
export type BusinessFormMethodName =
  | (typeof BUSINESS_FORM_METHODS)[number]['name']
  | (typeof FIELD_CONFIG_METHODS)[number]['name']
export type DataTableMethodName =
  | (typeof DATA_TABLE_METHODS)[number]['name']
  | (typeof FIELD_CONFIG_METHODS)[number]['name']
