import type { MaterialSchema } from '@ai-design/contracts'

/**
 * 节点 props 的语义校验 —— `materialSchema` 管不到的那一层。
 *
 * `materialSchema.props` 是 `Record<string, any>`(contracts/material.ts),
 * 只保证「props 是个对象」。物料各自的 props 含义没有 schema 描述,
 * 于是「结构合法但运行时行为不对」的节点能一路通过校验落进页面。
 * 这里收口这类矛盾:能静默丢数据、且判定规则明确的,报错交给 repair 修。
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 内联 options 与 dataId 不能并存。
 *
 * 运行时 `resolveFormControlConfig`(apps/web/src/materials/business-form/formConfig.ts)
 * 在 `dataId != null` 时用数据源整个覆盖 `control.options`,内联选项被静默丢弃。
 * 模型照模板生成时极易踩中:选择器类模板自带 `dataId`,模型改写 options 却留着
 * 抄来的 dataId,产出的下拉框显示的是数据源内容而不是它写的选项 ——
 * 结构完全合法,不报错就没人发现。
 */
export function findNodePropsConflict(node: MaterialSchema): string | undefined {
  if (node.dataId === undefined || node.dataId === null) return undefined

  const control = node.props.control
  if (!isPlainObject(control)) return undefined
  if (!Array.isArray(control.options) || control.options.length === 0) return undefined

  return (
    `节点 “${node.id}” 同时写了 control.options 和 dataId “${String(node.dataId)}”。` +
    '运行时 dataId 会用数据源覆盖 options,内联选项会被丢弃。' +
    '选项写死在节点里就删掉 dataId;要用数据源就删掉 control.options。'
  )
}

/**
 * 查整棵子树,返回首个问题 —— add-node 是连子树一起加的,每个节点都是新的。
 *
 * update-node 不能用这个:它只改一个节点,子树是页面里的既有内容,
 * 拿新规则去查旧节点会因为无关的历史问题挡下一次合法修改。那里查单节点。
 */
export function findSubtreePropsConflict(node: MaterialSchema): string | undefined {
  const conflict = findNodePropsConflict(node)
  if (conflict) return conflict

  for (const child of node.children) {
    const childConflict = findSubtreePropsConflict(child)
    if (childConflict) return childConflict
  }
  return undefined
}
