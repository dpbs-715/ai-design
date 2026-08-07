import type { PageSchema } from '@/schema/page.ts'
import { z } from 'zod'

import { streamSse } from './sseClient.ts'

/**
 * 设计操作。与 `@ai-design/agents` 的 `DesignOperation` 对应 —— 那个包依赖
 * LangGraph 与 node:crypto,不能进浏览器,所以这里按线路格式重新声明。
 */
const designOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('add-node'),
    parentId: z.string(),
    node: z.unknown(),
    index: z.number().optional(),
  }),
  z.object({ type: z.literal('remove-node'), nodeId: z.string() }),
  z.object({
    type: z.literal('update-node'),
    nodeId: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    placement: z.unknown().optional(),
  }),
  z.object({
    type: z.literal('move-node'),
    nodeId: z.string(),
    parentId: z.string(),
    index: z.number().optional(),
  }),
])

export type DesignOperation = z.infer<typeof designOperationSchema>

/** 操作级错误定位到下标,方案级错误不属于任何单条操作。 */
const designErrorSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('operation'),
    index: z.number(),
    operationType: z.string(),
    message: z.string(),
  }),
  z.object({ kind: z.literal('proposal'), message: z.string() }),
])

export type DesignError = z.infer<typeof designErrorSchema>

/**
 * `previewPage` 保持不透明 —— 由消费方用 `parsePageSchema` 校验。那个入口除了
 * schema 还会校验物料容纳规则与 id 唯一性,比这里直接 parse 更严。
 */
const pageDesignResultSchema = z.object({
  ok: z.boolean(),
  summary: z.string(),
  operations: z.array(designOperationSchema),
  previewPage: z.unknown().optional(),
  errors: z.array(designErrorSchema),
})

export type PageDesignResult = z.infer<typeof pageDesignResultSchema>

/** 图节点名。用于把执行进度翻译成用户看得懂的文案。 */
export type AgentNodeName = 'understand' | 'plan' | 'apply' | 'repair'

export type AgentStreamEvent =
  | { type: 'node'; node: string }
  | { type: 'completed'; result: PageDesignResult }
  | { type: 'aborted' }
  | { type: 'failed'; message: string }

/**
 * 事件按 type 分派解析。只挑前端真正用到的字段 —— `node` 事件的 data
 * 携带整个状态增量(含消息历史),那部分对 UI 没用。
 */
function parseEvent(raw: string): AgentStreamEvent | undefined {
  const payload: unknown = JSON.parse(raw)
  if (typeof payload !== 'object' || payload === null) return undefined
  const event = payload as Record<string, unknown>

  if (event.type === 'node' && typeof event.node === 'string') {
    return { type: 'node', node: event.node }
  }
  if (event.type === 'completed') {
    const result = pageDesignResultSchema.safeParse(event.result)
    return result.success
      ? { type: 'completed', result: result.data }
      : { type: 'failed', message: '服务端返回了无法识别的设计结果' }
  }
  if (event.type === 'aborted') return { type: 'aborted' }
  if (event.type === 'failed') {
    return { type: 'failed', message: typeof event.message === 'string' ? event.message : '执行失败' }
  }
  return undefined
}

export interface StreamPageDesignOptions {
  projectId: string
  request: string
  page: PageSchema
  selectedNodeIds?: string[]
  /** 多轮会话线程 id。同一线程内模型能理解「刚才那个」这类指代。 */
  threadId?: string
  signal?: AbortSignal
}

/** 流式执行页面设计,逐个产出执行事件。 */
export async function* streamPageDesign({
  projectId,
  request,
  page,
  selectedNodeIds,
  threadId,
  signal,
}: StreamPageDesignOptions): AsyncGenerator<AgentStreamEvent> {
  const frames = streamSse({
    path: `/projects/${projectId}/agents/page-design/stream`,
    body: {
      request,
      page,
      ...(selectedNodeIds?.length ? { selectedNodeIds } : {}),
      ...(threadId ? { threadId } : {}),
    },
    ...(signal ? { signal } : {}),
  })

  for await (const frame of frames) {
    const event = parseEvent(frame.data)
    if (event) yield event
  }
}
