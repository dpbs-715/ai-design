import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { AgentLogger } from '../../core/ports/logger.js'

/** 运行 page-design 图需要的外部依赖,通过 RunnableConfig 传入。 */
export interface PageDesignContext {
  model: BaseChatModel
  logger: AgentLogger
  signal?: AbortSignal
}
