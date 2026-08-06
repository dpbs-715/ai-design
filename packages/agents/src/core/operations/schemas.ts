import { materialPlacementSchema, materialSchema } from '@ai-design/contracts'
import type { MaterialPlacement, MaterialSchema } from '@ai-design/contracts'
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
  node: z.json().describe('完整物料节点,含 type/name/id/placement/children/props'),
  index: z.number().int().nonnegative().optional(),
})

export const removeNodeOperationSchema = z.object({
  type: z.literal('remove-node'),
  nodeId: z.string().min(1),
})

export const updateNodeOperationSchema = z.object({
  type: z.literal('update-node'),
  nodeId: z.string().min(1),
  props: z.record(z.string(), z.json()).optional(),
  style: z.record(z.string(), z.json()).optional(),
  placement: materialPlacementSchema.optional(),
})

export const moveNodeOperationSchema = z.object({
  type: z.literal('move-node'),
  nodeId: z.string().min(1),
  parentId: z.string().min(1),
  index: z.number().int().nonnegative().optional(),
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
  node: MaterialSchema
  index?: number
}

export interface RemoveNodeOperation {
  type: 'remove-node'
  nodeId: string
}

export interface UpdateNodeOperation {
  type: 'update-node'
  nodeId: string
  props?: Record<string, any>
  style?: Record<string, any>
  placement?: MaterialPlacement
}

export interface MoveNodeOperation {
  type: 'move-node'
  nodeId: string
  parentId: string
  index?: number
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
