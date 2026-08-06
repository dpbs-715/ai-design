import { ChatOpenAI } from '@langchain/openai'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { AgentModelConfig } from './model-config.js'

/**
 * 按配置创建聊天模型。使用 OpenAI 兼容协议,
 * `baseURL` 可指向自托管或第三方端点。
 */
export function createChatModel(config: AgentModelConfig): BaseChatModel {
  return new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    ...(config.temperature === undefined ? {} : { temperature: config.temperature }),
    ...(config.timeoutMs === undefined ? {} : { timeout: config.timeoutMs }),
    ...(config.maxRetries === undefined ? {} : { maxRetries: config.maxRetries }),
    ...(config.baseURL ? { configuration: { baseURL: config.baseURL } } : {}),
  })
}
