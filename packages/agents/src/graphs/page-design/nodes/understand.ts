import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { contextFromConfig } from '../../../core/runtime/context.js'
import { formatPageOutline, formatSelectedNodes } from '../../../core/tree/outline.js'
import type { PageDesignContext } from '../context.js'
import { UNDERSTAND_SYSTEM_PROMPT } from '../prompts.js'
import { designIntentSchema } from '../schemas.js'
import type { PageDesignGraphState } from '../state.js'

/** 把用户需求解析成结构化意图。多轮追问靠 state.messages 里的历史消化指代。 */
export function createUnderstandNode() {
  return async (state: PageDesignGraphState, config: RunnableConfig) => {
    const { model, logger, signal } = contextFromConfig<PageDesignContext>(config)
    logger.info('解析设计意图', { request: state.request })

    const userMessage = new HumanMessage(
      [
        `页面结构:\n${formatPageOutline(state.page)}`,
        `选中节点:${formatSelectedNodes(state.page, state.selectedNodeIds)}`,
        `设计需求:${state.request}`,
      ].join('\n\n'),
    )

    const intent = await model
      .withStructuredOutput(designIntentSchema, { name: 'design_intent' })
      .invoke([new SystemMessage(UNDERSTAND_SYSTEM_PROMPT), ...state.messages, userMessage], {
        signal,
      })

    return {
      intent,
      // 把本轮需求与解析结果记进历史,供后续轮次理解「刚才那个」。
      messages: [userMessage, new AIMessage(`已理解需求:${intent.summary}`)],
    }
  }
}
