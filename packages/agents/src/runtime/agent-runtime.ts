import { randomUUID } from 'node:crypto'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { contextToConfig } from '../core/runtime/context.js'
import { agentRegistry } from '../graphs/registry.js'
import type { AgentContextMap, AgentIOMap, AgentName } from '../graphs/registry.js'
import type { AgentStreamEvent } from './types.js'

/**
 * 编译后图的最小接口。registry 里的 factory 返回值结构复杂,
 * 这里只声明 runtime 真正用到的两个方法。
 */
interface CompiledAgentGraph {
  invoke(input: unknown, config?: RunnableConfig): Promise<unknown>
  stream(
    input: unknown,
    config?: RunnableConfig & { streamMode: 'updates' },
  ): Promise<AsyncIterable<Record<string, unknown>>>
}

export interface AgentRunOptions {
  signal?: AbortSignal
  /** 多轮会话的线程 id。配了 checkpointer 时必填,否则历史无法延续。 */
  threadId?: string
}

export interface CreateAgentRuntimeOptions {
  checkpointer?: BaseCheckpointSaver
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/**
 * Agent 执行门面。
 *
 * 结果映射由 registry 提供,所以这里不认识任何具体的 graph —— 旧实现
 * 在门面里 import 了 page-design 的 result mapper 和 state 类型,
 * 抽象漏了实现。
 */
export function createAgentRuntime(options: CreateAgentRuntimeOptions = {}) {
  const cache = new Map<AgentName, CompiledAgentGraph>()

  function getGraph(name: AgentName): CompiledAgentGraph {
    let graph = cache.get(name)
    if (!graph) {
      graph = agentRegistry[name].createGraph({
        ...(options.checkpointer ? { checkpointer: options.checkpointer } : {}),
      }) as unknown as CompiledAgentGraph
      cache.set(name, graph)
    }
    return graph
  }

  function buildConfig<N extends AgentName>(
    context: AgentContextMap[N],
    runOptions?: AgentRunOptions,
  ): RunnableConfig {
    const base = contextToConfig(context)
    return {
      ...base,
      // LangGraph 用它中断节点间的推进,节点内部的 model.invoke 另外从 context 取。
      ...(runOptions?.signal ? { signal: runOptions.signal } : {}),
      configurable: {
        ...base.configurable,
        // 配了 checkpointer 就必须有 thread_id —— 缺了会在写 checkpoint_blobs 时
        // 撞 NOT NULL 约束。不传 threadId 表示「本轮不需要延续历史」,
        // 这里给一个一次性 id 满足存储层,语义上仍是独立会话。
        thread_id: runOptions?.threadId ?? `once:${randomUUID()}`,
      },
    }
  }

  async function invoke<N extends AgentName>(
    name: N,
    input: AgentIOMap[N]['input'],
    context: AgentContextMap[N],
    runOptions?: AgentRunOptions,
  ): Promise<AgentIOMap[N]['output']> {
    const state = await getGraph(name).invoke(input, buildConfig(context, runOptions))
    return agentRegistry[name].toResult(state) as AgentIOMap[N]['output']
  }

  /**
   * 流式执行。终态事件带上最终结果 —— 消费方不必从 node data 里反推。
   */
  async function* stream<N extends AgentName>(
    name: N,
    input: AgentIOMap[N]['input'],
    context: AgentContextMap[N],
    runOptions?: AgentRunOptions,
  ): AsyncIterable<AgentStreamEvent> {
    const graph = getGraph(name)
    const config = buildConfig(context, runOptions)
    let lastState: Record<string, unknown> = {}

    try {
      const updates = await graph.stream(input, { ...config, streamMode: 'updates' })
      for await (const update of updates) {
        for (const [node, data] of Object.entries(update)) {
          // 累积各节点的状态增量,用于在结束时组装最终结果。
          if (data && typeof data === 'object') {
            lastState = { ...lastState, ...(data as Record<string, unknown>) }
          }
          yield { type: 'node', agent: name, node, data }
        }
      }
      yield { type: 'completed', agent: name, result: agentRegistry[name].toResult(lastState) }
    } catch (error) {
      // 主动取消与真实错误要能分开 —— 旧实现都压成 failed。
      if (isAbortError(error) || runOptions?.signal?.aborted) {
        yield { type: 'aborted', agent: name }
        return
      }
      yield {
        type: 'failed',
        agent: name,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  }

  return { invoke, stream }
}

export type AgentRuntime = ReturnType<typeof createAgentRuntime>
