/**
 * 模型配置。`baseURL` 留空时走 OpenAI 官方端点,
 * 填写时可指向自托管或第三方兼容端点。
 */
export interface AgentModelConfig {
  apiKey: string
  model: string
  baseURL?: string
  temperature?: number
  /** 单次请求超时,毫秒。 */
  timeoutMs?: number
  maxRetries?: number
}
