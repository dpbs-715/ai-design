import { materialPlacementSchema, materialSchema } from '@ai-design/contracts'
import type { MaterialPlacement } from '@ai-design/contracts'
import { z } from 'zod'

/**
 * LLM 结构化输出用的节点 schema —— 故意不复用 contracts 的 `materialSchema`。
 *
 * `materialSchema` 的 props/style 走 `jsonObjectSchema`,而后者带 `.transform()`
 * (contracts/material.ts:7)。zod 无法把 transform 表达成 JSON Schema,
 * 嵌进结构化输出会直接抛 “Transforms cannot be represented in JSON Schema”。
 * 这里收成不透明 JSON,节点的真实结构在 apply 阶段用 `materialSchema` 校验 ——
 * transform 只影响 schema 生成,parse 时是正常的。
 */
export const addNodeOperationSchema = z.object({
  type: z.literal('add-node'),
  parentId: z.string().min(1),
  // 用 record 而不是 `z.json()`:后者展开成递归的六类型 anyOf,`$ref` 到它时拿不到
  // 单一 `type`,过不了 MFJS 的「每个子 schema 必须有 type」(见 llm/mfjs.ts)。
  // 节点本来就一定是对象,record 既更准确也更干净。
  node: z
    .record(z.string(), z.unknown())
    .describe('完整物料节点,含 type/name/id/placement/children/props'),
  // nullish 而非 optional:MFJS 的 strict 要求所有属性都在 required 里,
  // 「没有值」只能用可空联合表达(见 llm/mfjs.ts),模型会显式给出 null。
  index: z.number().int().nonnegative().nullish(),
})

export const removeNodeOperationSchema = z.object({
  type: z.literal('remove-node'),
  nodeId: z.string().min(1),
})

export const updateNodeOperationSchema = z.object({
  type: z.literal('update-node'),
  nodeId: z.string().min(1),
  // 同 add-node 的 node:用 unknown 而非 `z.json()`,后者展开成递归 `$ref`,
  // 而 props/style 本来就是任意键值袋,record 表达得更准也更干净。
  props: z.record(z.string(), z.unknown()).nullish(),
  style: z.record(z.string(), z.unknown()).nullish(),
  placement: materialPlacementSchema.nullish(),
})

export const moveNodeOperationSchema = z.object({
  type: z.literal('move-node'),
  nodeId: z.string().min(1),
  parentId: z.string().min(1),
  index: z.number().int().nonnegative().nullish(),
})

export const designOperationSchema = z.discriminatedUnion('type', [
  addNodeOperationSchema,
  removeNodeOperationSchema,
  updateNodeOperationSchema,
  moveNodeOperationSchema,
])

export interface AddNodeOperation {
  type: 'add-node'
  parentId: string
  /**
   * LLM 给的原始 JSON,**尚未校验**(上面的 schema 只约束到「是个对象」,原因见文件头注释)。
   * 类型故意是 unknown 而不是 MaterialSchema —— 声明成后者是往类型里写假话,
   * 消费方会以为拿到的是校验过的节点而直接使用。
   * 用 `applyDesignOperations` 里的 `materialSchema.safeParse` 转成真正的节点。
   */
  node: unknown
  /** 可能是 null:strict 模式下模型用显式 null 表示「不指定」,见 llm/mfjs.ts。 */
  index?: number | null
}

export interface RemoveNodeOperation {
  type: 'remove-node'
  nodeId: string
}

export interface UpdateNodeOperation {
  type: 'update-node'
  nodeId: string
  props?: Record<string, any> | null
  style?: Record<string, any> | null
  placement?: MaterialPlacement | null
}

export interface MoveNodeOperation {
  type: 'move-node'
  nodeId: string
  parentId: string
  index?: number | null
}

export type DesignOperation =
  | AddNodeOperation
  | RemoveNodeOperation
  | UpdateNodeOperation
  | MoveNodeOperation

export const designProposalSchema = z.object({
  summary: z.string().min(1),
  operations: z.array(designOperationSchema),
})

export interface DesignProposal {
  summary: string
  operations: DesignOperation[]
}
