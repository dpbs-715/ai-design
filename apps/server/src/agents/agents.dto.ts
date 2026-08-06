import { pageSchema } from '@ai-design/contracts'
import { z } from 'zod'

/**
 * 页面设计请求。
 *
 * `page` 由前端传入当前草稿 —— agents 模块不读写 pages 表:
 * 保存要走 workspace 既有的 `PUT projects/:projectId/pages/:pageId`,
 * 那条路径已经处理了 revision 乐观锁与冲突区分。
 */
export const pageDesignRequestSchema = z.object({
  request: z.string().trim().min(1, '请输入设计需求'),
  page: pageSchema,
  selectedNodeIds: z.array(z.string().min(1)).optional(),
  /** 多轮会话线程 id。省略则每次都是独立会话。 */
  threadId: z.string().min(1).optional(),
})

export type PageDesignRequest = z.infer<typeof pageDesignRequestSchema>
