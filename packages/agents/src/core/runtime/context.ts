import type { RunnableConfig } from '@langchain/core/runnables'

const AGENT_CONTEXT_KEY = 'aiDesignAgentContext'

/** 把运行时依赖塞进 RunnableConfig,供图节点取用。 */
export function contextToConfig(context: object): RunnableConfig {
  return { configurable: { [AGENT_CONTEXT_KEY]: context } }
}

export function contextFromConfig<TContext>(config: RunnableConfig): TContext {
  const context = config.configurable?.[AGENT_CONTEXT_KEY]
  if (!context) {
    throw new Error('缺少 Agent 运行时上下文,请通过 contextToConfig 传入')
  }
  return context as TContext
}
