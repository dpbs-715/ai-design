/**
 * 模型配置。`baseURL` 留空时走 OpenAI 官方端点,
 * 填写时可指向自托管或第三方兼容端点。
 */
export interface AgentModelConfig {
  apiKey: string
  model: string
  baseURL?: string
  temperature?: number
  /**
   * 单次响应的最大 token 数。
   *
   * 结构化输出撞到上限时返回的是半截 JSON(`finish_reason=length`),
   * 症状和「模型乱写」一样是解析失败 —— 生成整棵节点子树的方案尤其容易撞到。
   * 留空则用端点默认值。
   */
  maxTokens?: number
  /** 单次请求超时,毫秒。 */
  timeoutMs?: number
  maxRetries?: number
}
