/**
 * 把 LLM 给的原始节点 JSON 补齐成合法节点结构。
 *
 * 存在的原因:`get_material_detail` 返回的是 `MaterialTemplate`,而校验用的是
 * `materialSchema`(节点)。两者差在「模板里可以省略的字段,节点里是必填」——
 * 模板故意不带 `children`(contracts/material.ts 的 `MaterialTemplate` 把它标成
 * 可选),但 `materialSchema.children` 是必填数组。prompt 让模型「照模板补齐」,
 * 模型照做,产出的节点却过不了校验。
 *
 * 编辑器侧早就有这一步:拖拽建节点走 `createNode` → `assignNodeIds`
 * (apps/web/src/materials/index.ts),那里 `const { children = [] } = template`
 * 就把这个差异吃掉了。agent 侧缺的正是同一步,所以只有 agent 会报
 * `children.0.children Invalid input: expected array, received undefined`。
 *
 * 只补「模板本来就允许省略、且默认值唯一」的字段:
 * - `children` → `[]`,递归。
 * - `events[].code` → `''`,所有物料模板都用空串表示「事件已声明、处理逻辑为空」。
 *
 * 不补 `events[].name`、`props`、`placement` 之类没有唯一正确默认值的字段 ——
 * 那属于模型真的写错了,要让校验报出来交给 repair 节点修,而不是在这里编一个值
 * 蒙过去。字段类型不对时(比如 `children` 给了个字符串)原样透传,同理。
 */

function normalizeEvent(event: unknown): unknown {
  if (!isPlainObject(event)) return event
  // 只在 code 缺失时补;给了 null 或数字属于类型写错,交给校验报错。
  if (event.code !== undefined) return event
  return { ...event, code: '' }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 递归补齐节点及其子树。非对象原样返回,让 `materialSchema` 去报错。 */
export function normalizeAgentNode(node: unknown): unknown {
  if (!isPlainObject(node)) return node

  const normalized: Record<string, unknown> = { ...node }

  if (normalized.children === undefined) {
    normalized.children = []
  } else if (Array.isArray(normalized.children)) {
    normalized.children = normalized.children.map(normalizeAgentNode)
  }

  if (Array.isArray(normalized.events)) {
    normalized.events = normalized.events.map(normalizeEvent)
  }

  return normalized
}
