import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { InteropZodType } from '@langchain/core/utils/types'

/**
 * 结构化输出统一走 tool calling。
 *
 * 不指定 `method` 时 LangChain 会按模型名反向白名单猜(@langchain/openai
 * utils/output.js:`getStructuredOutputMethod`):只要名字不是 gpt-3* / gpt-4-* / gpt-4,
 * 就认为支持 OpenAI 的 `json_schema` response format。第三方端点的模型名(kimi-*、
 * qwen-* 等)全都能通过这个检查,于是默认落到 `jsonSchema`。
 *
 * 而多数 OpenAI 兼容端点只是「收下 response_format 但不约束解码」。
 * 返回里没有 `parsed` 字段,LangChain 就退回去对 `message.content` 直接 JSON.parse
 * (chat_models/base.js 的 altParser)—— 等于把「模型自觉只输出 JSON」当成契约。
 * 思考模型一旦把推理链写进 content,这层就必然崩,报 OUTPUT_PARSING_FAILURE,
 * 且崩在解析阶段、拿不到任何可用结果。
 *
 * tool calling 没这个问题:结果在 `tool_calls[].args`,与 `content` 是分开的字段,
 * 模型在 content 里写多少思考都污染不到它。本项目用的端点已经验证支持工具调用
 * (物料检索一直走的就是 tool calling),所以这里固定用它。
 *
 * 为什么不用 `jsonMode`(即 Kimi 文档里的 `response_format: {type:'json_object'}`):
 * 那条路只发 response_format,**schema 完全不发给模型** —— 字段名、枚举值、
 * 字段描述一个都不带,模型只能猜。Kimi 官方示例因此要在 system prompt 里手写
 * 「请使用如下 JSON 格式输出」。改用它就得把三份 zod schema 手抄进 prompt 再维护同步,
 * 抄漏或改动不同步都会静默产出字段不对的结果。functionCalling 把 schema 作为
 * 工具参数一起发出去,这份重复就不存在。
 */
export function withDesignStructuredOutput<T extends Record<string, any>>(
  model: BaseChatModel,
  schema: InteropZodType<T>,
  name: string,
) {
  return model.withStructuredOutput<T>(schema, { name, method: 'functionCalling' })
}
