import { Annotation } from '@langchain/langgraph'
import type { BaseMessage } from '@langchain/core/messages'
import type { PageSchema } from '@ai-design/contracts'
import type { DesignError } from '../../core/operations/errors.js'
import type { DesignProposal } from '../../core/operations/schemas.js'
import type { DesignIntent } from './schemas.js'

/** 只保留最后一次写入。 */
function replace<T>(_current: T, next: T): T {
  return next
}

export const PageDesignStateAnnotation = Annotation.Root({
  /** 本轮的设计需求。 */
  request: Annotation<string>({ reducer: replace, default: () => '' }),

  /** 当前页面。多轮会话里每轮都以上一轮的 previewPage 为基础由调用方传入。 */
  page: Annotation<PageSchema>({ reducer: replace }),

  /** 用户在画布上选中的节点。 */
  selectedNodeIds: Annotation<string[]>({ reducer: replace, default: () => [] }),

  /**
   * 跨轮对话历史。checkpointer 持久化这个字段,
   * 让「把刚才那个按钮改成蓝色」这类追问能落到具体节点。
   */
  messages: Annotation<BaseMessage[]>({
    reducer: (current, next) => current.concat(next),
    default: () => [],
  }),

  intent: Annotation<DesignIntent | undefined>({ reducer: replace, default: () => undefined }),

  proposal: Annotation<DesignProposal | undefined>({ reducer: replace, default: () => undefined }),

  errors: Annotation<DesignError[]>({ reducer: replace, default: () => [] }),

  repairCount: Annotation<number>({ reducer: replace, default: () => 0 }),

  /** 应用操作后的页面。仅在全部操作成功时写入。 */
  previewPage: Annotation<PageSchema | undefined>({ reducer: replace, default: () => undefined }),
})

export type PageDesignGraphState = typeof PageDesignStateAnnotation.State
