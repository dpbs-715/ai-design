import { AIMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { z } from 'zod'
import { toMfjsSchema } from './mfjs.js'

/**
 * 结构化输出走 Kimi 的 Structured Output(`response_format: json_schema` + `strict`)。
 *
 * 三条路在本项目端点(Kimi,思考模型)上的实际表现:
 *
 * - `functionCalling`:LangChain 会发**强制** `tool_choice`,端点直接 400
 *   `tool_choice 'specified' is incompatible with thinking enabled`。
 *   注意这不否定工具调用本身 —— 物料检索走的 `model.bindTools(tools)` 不带 tool_choice,
 *   一直是好的。被拒的是「强制调用指定工具」。
 * - `jsonMode`:可用,但只保证「是合法 JSON Object」,不约束字段。
 * - `jsonSchema`:精确约束字段,且 strict 只作用于 `content`、不约束推理轨迹 ——
 *   推理留在 `reasoning_content` 里,天然不会污染要解析的那个字段。这是最合适的。
 *
 * 之所以没有直接用 `model.withStructuredOutput(..., {method:'jsonSchema'})`,
 * 是因为它把 zod 生成的**标准** JSON Schema 原样发出去,而 Kimi 校验的是 MFJS
 * 子集。不合规不会报错,只是静默忽略 schema(见 mfjs.ts)—— 最初那次
 * OUTPUT_PARSING_FAILURE 就是这么来的:schema 被丢掉、生成无约束、推理写进了 content。
 * 所以这里自己拼 `response_format`,发清洗过的 schema,再用 zod 做最终校验。
 */

/** 输出被长度上限截断时的提示。文档明确建议检查 finish_reason 而不是干等解析失败。 */
const TRUNCATED_HINT =
  '模型输出被长度上限截断(finish_reason=length),JSON 不完整。' +
  '调大 maxTokens,或让 schema/输出更小。'

export interface DesignStructuredOutput<T> {
  invoke: (messages: BaseMessage[], config?: RunnableConfig) => Promise<T>
}

export function withDesignStructuredOutput<T extends Record<string, any>>(
  model: BaseChatModel,
  schema: z.ZodType<T>,
  name: string,
): DesignStructuredOutput<T> {
  // `response_format` 是 OpenAI 兼容端点的调用参数,不在 BaseChatModel 的
  // CallOptions 里(那是各家共有的最小集),所以要在这里转换类型。
  const bound = model.withConfig({
    response_format: {
      type: 'json_schema',
      json_schema: { name, strict: true, schema: toMfjsSchema(schema) },
    },
  } as Parameters<typeof model.withConfig>[0])

  return {
    invoke: async (messages, config) => {
      let reply
      try {
        reply = await bound.invoke(messages, config)
      } catch (error) {
        // `response_format: json_schema` 下 OpenAI SDK 会自己解析一遍,撞长度上限时
        // 在这里就抛了 —— 拿不到 message,下面的 finish_reason 检查根本轮不到。
        // 它的原文没说该怎么办,补一句。
        if (error instanceof Error && /length limit/i.test(error.message)) {
          throw new Error(`${TRUNCATED_HINT}(原始错误:${error.message})`)
        }
        throw error
      }

      // 端点不走 SDK 那条解析路径时,这里是第二道 —— 截断和「模型乱写」症状相同
      // (都是 JSON 解析失败),但成因和处置完全不同,不区分下次又要从头查。
      const finishReason =
        reply instanceof AIMessage
          ? (reply.response_metadata?.finish_reason ?? reply.additional_kwargs?.finish_reason)
          : undefined
      if (finishReason === 'length') throw new Error(TRUNCATED_HINT)

      const text = typeof reply.content === 'string' ? reply.content : JSON.stringify(reply.content)
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch (error) {
        throw new Error(
          `模型输出不是合法 JSON(${error instanceof Error ? error.message : String(error)}):${text.slice(0, 500)}`,
        )
      }

      // 可选字段在 strict 下会拿到显式 null,所以 schema 那边用的是 nullish
      // 而不是 optional —— 不在这里剥 null。按深度剥会误伤业务数据:
      // 物料模板里的 `initialValue: null` 是有意义的取值。
      return schema.parse(parsed)
    },
  }
}
