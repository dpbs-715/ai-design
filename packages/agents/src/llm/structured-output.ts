import { SystemMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { RunnableConfig } from '@langchain/core/runnables'
import { z } from 'zod'

/**
 * 结构化输出统一走 JSON Mode,并把 schema 一起注入 prompt。
 *
 * 三条路在本项目的端点(Kimi,思考模型)上各自的实际表现:
 *
 * - `jsonSchema`:LangChain 的默认选择,因为它按模型名反向白名单猜
 *   (@langchain/openai utils/output.js `getStructuredOutputMethod`)—— 只要名字不是
 *   gpt-3* / gpt-4-* / gpt-4 就当作支持 OpenAI 的 `json_schema`,第三方模型名全部命中。
 *   而端点只是「收下 response_format 但不约束解码」,返回里没有 `parsed` 字段,
 *   LangChain 退回去对 `message.content` 直接 JSON.parse(chat_models/base.js 的 altParser)。
 *   思考模型把推理链写进 content 时这层必崩,报 OUTPUT_PARSING_FAILURE。
 * - `functionCalling`:会发**强制** `tool_choice: {type:'function', function:{name}}`,
 *   端点直接 400:`tool_choice 'specified' is incompatible with thinking enabled`。
 *   注意这不否定工具调用本身 —— 物料检索走的 `model.bindTools(tools)` 不带 tool_choice,
 *   一直是好的。被拒的是「强制调用指定工具」,不是「有工具」。
 * - `jsonMode`:即 Kimi 文档里的 `response_format: {type:'json_object'}`,官方支持,
 *   不涉及 tool_choice。这是唯一可用的一条。
 *
 * jsonMode 的短板是 LangChain 只发 response_format、不把 schema 放进 messages
 * (`asJsonSchema` 只进 `ls_structured_output_format`,那是 LangSmith 的追踪元数据)。
 * 所以这里自己补上:用 `z.toJSONSchema` 从同一份 zod schema 机械生成契约文本再注入,
 * 不是在 prompt 里手写一份形状 —— 手写会与 schema 各自演进,生成不会。
 */

/** 契约说明拼在消息末尾,靠近生成位置。JSON Mode 也要求消息里出现 “JSON” 字样。 */
function schemaInstruction(schema: z.ZodType, name: string): SystemMessage {
  return new SystemMessage(
    [
      `只输出一个 JSON 对象,不要加解释文字,不要包 \`\`\`json 代码块。`,
      `该对象必须满足下面这份 JSON Schema(名称 ${name}):`,
      JSON.stringify(z.toJSONSchema(schema)),
      '所有 required 字段都必须出现;不要额外添加 schema 里没有的字段。',
      '思考过程不要写进输出 —— 输出的第一个字符是 `{`,最后一个是 `}`。',
    ].join('\n'),
  )
}

export function withDesignStructuredOutput<T extends Record<string, any>>(
  model: BaseChatModel,
  schema: z.ZodType<T>,
  name: string,
) {
  const runnable = model.withStructuredOutput<T>(schema, { name, method: 'jsonMode' })
  const instruction = schemaInstruction(schema, name)

  return {
    /** 注入契约后再调用 —— 包一层是为了让调用点不可能漏掉这一步。 */
    invoke: (messages: BaseMessage[], config?: RunnableConfig): Promise<T> =>
      runnable.invoke([...messages, instruction], config),
  }
}
