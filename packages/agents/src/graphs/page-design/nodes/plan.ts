import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { designProposalSchema } from '../../../core/operations/schemas.js'
import { contextFromConfig } from '../../../core/runtime/context.js'
import { formatPageOutline } from '../../../core/tree/outline.js'
import { designTools } from '../../../tools/design-tools.js'
import type { PageDesignContext } from '../context.js'
import { PLAN_SYSTEM_PROMPT } from '../prompts.js'
import type { PageDesignGraphState } from '../state.js'
import { runToolLoop } from './tool-loop.js'

/**
 * 生成页面修改操作。
 *
 * 分两步:先让模型用工具查物料(不再把全量清单塞进 prompt),
 * 再让它基于查到的信息输出结构化 operations。
 */
export function createPlanNode() {
  return async (state: PageDesignGraphState, config: RunnableConfig) => {
    const { model, logger, signal } = contextFromConfig<PageDesignContext>(config)
    logger.info('生成页面修改操作')

    const task = new HumanMessage(
      [
        `页面结构:\n${formatPageOutline(state.page)}`,
        `设计意图:\n${JSON.stringify(state.intent, null, 2)}`,
        '先用工具确认要用哪些物料及其默认模板,然后给出修改操作。',
      ].join('\n\n'),
    )

    const transcript = await runToolLoop({
      model,
      tools: designTools,
      messages: [new SystemMessage(PLAN_SYSTEM_PROMPT), task],
      logger,
      signal,
    })

    const proposal = await model
      .withStructuredOutput(designProposalSchema, { name: 'design_proposal' })
      .invoke(
        [
          ...transcript,
          new HumanMessage('把上面的结论整理成最终的 operations 与 summary。'),
        ],
        { signal },
      )

    logger.info('已生成操作', { count: proposal.operations.length })
    return { proposal }
  }
}
