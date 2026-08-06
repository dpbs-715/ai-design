import { AIMessage, ToolMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { AgentLogger } from '../../../core/ports/logger.js'

/** 工具调用轮次上限,防止模型陷入死循环。 */
export const MAX_TOOL_ITERATIONS = 6

export interface RunToolLoopOptions {
  model: BaseChatModel
  tools: StructuredToolInterface[]
  messages: BaseMessage[]
  logger: AgentLogger
  signal?: AbortSignal
}

/**
 * 让模型自由调用工具收集信息,直到它不再请求工具。
 *
 * 返回完整的消息序列(含工具调用与结果),交给调用方再做一次结构化输出。
 * 结构化输出和工具调用分两步做 —— 不少 OpenAI 兼容端点不支持同时启用两者。
 */
export async function runToolLoop({
  model,
  tools,
  messages,
  logger,
  signal,
}: RunToolLoopOptions): Promise<BaseMessage[]> {
  if (!model.bindTools) {
    logger.warn('模型不支持工具调用,跳过物料检索')
    return messages
  }

  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]))
  const boundModel = model.bindTools(tools)
  const transcript = [...messages]

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
    const reply = await boundModel.invoke(transcript, { signal })
    transcript.push(reply)

    const toolCalls = reply instanceof AIMessage ? (reply.tool_calls ?? []) : []
    if (toolCalls.length === 0) {
      return transcript
    }

    for (const call of toolCalls) {
      const tool = toolsByName.get(call.name)
      const callId = call.id ?? call.name
      if (!tool) {
        transcript.push(
          new ToolMessage({ tool_call_id: callId, content: `工具 “${call.name}” 不存在` }),
        )
        continue
      }
      logger.debug('调用工具', { name: call.name, args: call.args })
      try {
        const result = await tool.invoke(call.args, { signal })
        transcript.push(
          new ToolMessage({
            tool_call_id: callId,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          }),
        )
      } catch (error) {
        transcript.push(
          new ToolMessage({
            tool_call_id: callId,
            content: `工具执行失败:${error instanceof Error ? error.message : String(error)}`,
          }),
        )
      }
    }
  }

  logger.warn('工具调用达到上限,直接进入方案生成', { limit: MAX_TOOL_ITERATIONS })
  return transcript
}
