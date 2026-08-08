import { createMaterialTreeIndex, mapMaterialTree, materialSchema } from '@ai-design/contracts'
import type { MaterialSchema, PageSchema } from '@ai-design/contracts'
import { canMaterialTypeBeChild, materialNodeSchemas } from '@ai-design/materials'
import { operationError, proposalError } from './errors.js'
import type { DesignError } from './errors.js'
import { normalizeAgentNode } from './normalize.js'
import type { DesignOperation } from './schemas.js'
import { findNodePropsConflict, findSubtreePropsConflict } from './validate-props.js'

export interface ApplyOperationsResult {
  /** 应用成功时的新页面;失败时是原页面(不做部分修改)。 */
  page: PageSchema
  errors: DesignError[]
}

/** 收集一棵子树里的所有节点 id,用于检测新增节点的 id 冲突。 */
function collectSubtreeIds(node: MaterialSchema, ids: string[] = []): string[] {
  ids.push(node.id)
  node.children.forEach((child) => collectSubtreeIds(child, ids))
  return ids
}

/**
 * 物料级结构校验 + 规范化 —— 与客户端 `parsePageSchema` 同一份 schema
 * (@ai-design/materials 的 `materialNodeSchemas`)。
 *
 * contracts 的 `materialSchema` 只查通用骨架,`props` 是不透明对象;物料各自
 * props 的约束(枚举取值、必填字段、选项形状)只有物料级 schema 知道。少了这层,
 * 模型发明的取值(`control.type: "email"` 之类)在服务端全过、到客户端才硬失败,
 * repair 循环帮不上忙。在这里拦下,错误会交给 repair 修。
 *
 * 解析结果同时是规范化结果:schema 里的默认值(比如操作列的 `field: '$actions'`)
 * 只存在于 parse 输出里 —— 只校验不用它,入树的 JSON 仍然缺字段。
 */
function parseWithMaterialSchema(
  node: MaterialSchema,
): { node: MaterialSchema; conflict?: never } | { conflict: string } {
  const schema = materialNodeSchemas[node.type]
  if (!schema) return { node }
  const result = schema.safeParse(node)
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path.join('.') || 'node'
    return {
      conflict: `节点 “${node.name}”(${node.id})结构不合法:${path} ${issue?.message ?? '校验失败'}`,
    }
  }
  return { node: result.data }
}

/** add-node 连子树一起加,每个节点都要过物料级 schema,入树的也是各自的规范化副本。 */
function normalizeSubtree(
  node: MaterialSchema,
): { node: MaterialSchema; conflict?: never } | { conflict: string } {
  const parsed = parseWithMaterialSchema(node)
  if (parsed.conflict) return parsed
  const children: MaterialSchema[] = []
  for (const child of parsed.node.children) {
    const normalized = normalizeSubtree(child)
    if (normalized.conflict) return normalized
    children.push(normalized.node)
  }
  return { node: { ...parsed.node, children } }
}

/**
 * `index` 用 `== null` 同时兜住 undefined 和 null —— strict 模式下模型用显式 null
 * 表示「不指定位置」(见 llm/mfjs.ts)。只判 undefined 的话 null 会掉进 Math.min,
 * 算出 0,把节点静默插到最前面而不是追加到末尾。
 */
function insertAt<T>(items: T[], item: T, index?: number | null): T[] {
  const at = index == null ? items.length : Math.max(0, Math.min(index, items.length))
  return [...items.slice(0, at), item, ...items.slice(at)]
}

/** 从树中摘除指定 id 的节点。id 全局唯一,所以最多命中一个。 */
function detach(
  children: MaterialSchema[],
  nodeId: string,
): { children: MaterialSchema[]; removed?: MaterialSchema } {
  let removed: MaterialSchema | undefined

  function walk(nodes: MaterialSchema[]): MaterialSchema[] {
    const result: MaterialSchema[] = []
    for (const node of nodes) {
      if (node.id === nodeId) {
        removed = node
        continue
      }
      const nextChildren = walk(node.children)
      result.push(nextChildren === node.children ? node : { ...node, children: nextChildren })
    }
    return removed ? result : nodes
  }

  return { children: walk(children), removed }
}

/** 把节点插到指定父节点下。父节点是根时直接插顶层。 */
function attach(
  rootId: string,
  children: MaterialSchema[],
  parentId: string,
  node: MaterialSchema,
  index?: number | null,
): MaterialSchema[] {
  if (parentId === rootId) {
    return insertAt(children, node, index)
  }
  return mapMaterialTree(children, (candidate) =>
    candidate.id === parentId
      ? { ...candidate, children: insertAt(candidate.children, node, index) }
      : candidate,
  )
}

/**
 * 顺序应用设计操作。
 *
 * 与旧实现的关键区别:每条操作都针对**当前**树状态校验,通过后才应用。
 * 旧实现先对初始快照一次性校验、再顺序应用,两者错位,导致
 * "新增后立刻引用" 被误拒、"删除后重建同 id" 被误拒,
 * 而 "重复 id"、"往已删除的父节点下新增"、"移动到已删除的子树" 等
 * 反而被静默接受并丢数据。
 *
 * 任意一条操作失败即整体失败,返回原页面 —— 不留部分修改。
 */
export function applyDesignOperations(
  page: PageSchema,
  operations: DesignOperation[],
): ApplyOperationsResult {
  if (operations.length === 0) {
    return { page, errors: [proposalError('没有需要执行的修改操作')] }
  }

  const rootId = page.root.id
  const rootType = page.root.type
  let children = page.root.children

  for (const [index, operation] of operations.entries()) {
    const tree = createMaterialTreeIndex(children, rootId)
    const nodeType = (id: string) => (id === rootId ? rootType : tree.nodeMap.get(id)?.type)
    const exists = (id: string) => id === rootId || tree.nodeMap.has(id)
    const fail = (message: string) => ({
      page,
      errors: [operationError(index, operation.type, message)],
    })

    switch (operation.type) {
      case 'add-node': {
        if (!exists(operation.parentId)) {
          return fail(`父节点 “${operation.parentId}” 不存在`)
        }
        // LLM 给的 node 是不透明 JSON(schemas.ts 说明了原因),在这里才做真正的结构校验。
        // 校验前先补齐模板允许省略的字段(normalize.ts 说明了模板与节点的结构差异),
        // 否则「照模板生成」这条 prompt 指令必然撞校验失败。
        const parsed = materialSchema.safeParse(normalizeAgentNode(operation.node))
        if (!parsed.success) {
          const issue = parsed.error.issues[0]
          const path = issue?.path.join('.') || 'node'
          return fail(`节点结构不合法:${path} ${issue?.message ?? '校验失败'}`)
        }
        // 通用骨架之后再过物料级 schema —— 枚举越界、缺必填字段在这一层拦。
        // 入树的必须是解析后的规范化副本而不是 operation.node:schema 默认值
        // (比如操作列的 field: '$actions')只存在于 parse 输出里,用原始对象
        // 会静默丢掉它们;独立副本也避免页面树和 proposal 共享同一份节点。
        const normalized = normalizeSubtree(parsed.data)
        if (normalized.conflict) {
          return fail(normalized.conflict)
        }
        const node = normalized.node
        // 结构合法不代表 props 讲得通,再查一层语义(validate-props.ts 说明了为什么分开)。
        const conflict = findSubtreePropsConflict(node)
        if (conflict) {
          return fail(conflict)
        }
        const parentType = nodeType(operation.parentId)!
        if (!canMaterialTypeBeChild(parentType, node.type)) {
          return fail(`“${parentType}” 不能容纳 “${node.type}”`)
        }
        const incomingIds = collectSubtreeIds(node)
        const duplicate = incomingIds.find((id) => exists(id))
        if (duplicate !== undefined) {
          return fail(`节点 id “${duplicate}” 已存在`)
        }
        const selfDuplicate = incomingIds.find((id, at) => incomingIds.indexOf(id) !== at)
        if (selfDuplicate !== undefined) {
          return fail(`新增的子树内部存在重复 id “${selfDuplicate}”`)
        }
        children = attach(rootId, children, operation.parentId, node, operation.index)
        break
      }

      case 'remove-node': {
        if (operation.nodeId === rootId) {
          return fail('不能删除根节点')
        }
        if (!tree.nodeMap.has(operation.nodeId)) {
          return fail(`节点 “${operation.nodeId}” 不存在`)
        }
        children = detach(children, operation.nodeId).children
        break
      }

      case 'update-node': {
        if (operation.nodeId === rootId) {
          return fail('不能通过 update-node 修改根节点')
        }
        if (!tree.nodeMap.has(operation.nodeId)) {
          return fail(`节点 “${operation.nodeId}” 不存在`)
        }
        const merge = (node: MaterialSchema): MaterialSchema => ({
          ...node,
          props: operation.props ? { ...node.props, ...operation.props } : node.props,
          style: operation.style ? { ...node.style, ...operation.style } : node.style,
          placement: operation.placement ?? node.placement,
        })
        const merged = merge(tree.nodeMap.get(operation.nodeId)!)
        // 局部更新合并出的是完整节点,同样要过物料级 schema —— 只改一个字段也可能
        // 让节点落入不合法状态(比如把 control.type 改成枚举外的值)。与 add-node
        // 同理,入树用规范化副本,历史 JSON 里缺的默认值也借这次修改一并写回。
        const normalized = parseWithMaterialSchema(merged)
        if (normalized.conflict) {
          return fail(normalized.conflict)
        }
        // 局部更新同样能写出矛盾的 props(比如补了 options 却没删原有的 dataId),
        // 所以查的是合并后的结果,不是操作里那几个字段。
        const conflict = findNodePropsConflict(normalized.node)
        if (conflict) {
          return fail(conflict)
        }
        children = mapMaterialTree(children, (node) =>
          node.id === operation.nodeId ? normalized.node : node,
        )
        break
      }

      case 'move-node': {
        const moving = tree.nodeMap.get(operation.nodeId)
        if (!moving) {
          return fail(`节点 “${operation.nodeId}” 不存在`)
        }
        if (!exists(operation.parentId)) {
          return fail(`父节点 “${operation.parentId}” 不存在`)
        }
        if (operation.parentId === operation.nodeId) {
          return fail('不能把节点移动到它自己下面')
        }
        // 目标父节点在被移动子树内部 → 会形成环。
        if (collectSubtreeIds(moving).includes(operation.parentId)) {
          return fail('不能把节点移动到它自己的子节点下')
        }
        const parentType = nodeType(operation.parentId)!
        if (!canMaterialTypeBeChild(parentType, moving.type)) {
          return fail(`“${parentType}” 不能容纳 “${moving.type}”`)
        }
        const without = detach(children, operation.nodeId).children
        children = attach(rootId, without, operation.parentId, moving, operation.index)
        break
      }
    }
  }

  return { page: { ...page, root: { ...page.root, children } }, errors: [] }
}
