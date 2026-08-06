import { z } from 'zod'

export const designIntentSchema = z.object({
  action: z
    .enum(['create', 'modify', 'mixed'])
    .describe('create 表示从零新增,modify 表示调整已有节点,mixed 表示两者兼有'),
  summary: z.string().min(1).describe('用一句话概括用户想要达成的效果'),
  targetNodeIds: z
    .array(z.string())
    .default([])
    .describe('需求明确涉及的已有节点 id;纯新增时为空数组'),
})

export type DesignIntent = z.infer<typeof designIntentSchema>
