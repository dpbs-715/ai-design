import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { designProposalSchema } from '../../../core/operations/schemas.js'
import { contextFromConfig } from '../../../core/runtime/context.js'
import { formatPageOutline } from '../../../core/tree/outline.js'
import { withDesignStructuredOutput } from '../../../llm/structured-output.js'
import { designTools } from '../../../tools/design-tools.js'
import type { PageDesignContext } from '../context.js'
import { PLAN_SYSTEM_PROMPT } from '../prompts.js'
import type { PageDesignGraphState } from '../state.js'
import { runToolLoop } from './tool-loop.js'

/**
 * 生成页面修改操作。
 *
 * 分两步:先让模型取物料模板(清单已在 system prompt 里,只补模板),
 * 再让它基于模板输出结构化 operations。
 * 拆两步是因为不少 OpenAI 兼容端点不支持同时启用 tools 和 structured output;
 * 既然拆了,第一步就只负责取模板 —— 方案只在第二步生成一次。
 */
export function createPlanNode() {
  return async (state: PageDesignGraphState, config: RunnableConfig) => {
    const { model, logger, signal } = contextFromConfig<PageDesignContext>(config)
    logger.info('生成页面修改操作')

    const task = new HumanMessage(
      [
        `页面结构:\n${formatPageOutline(state.page)}`,
        `设计意图:\n${JSON.stringify(state.intent, null, 2)}`,
        '第一步:从物料清单里挑出这次要用的物料,一轮并行调用 get_material_detail 取完模板。',
        '模板到手就回 READY,方案留到第二步写。',
      ].join('\n\n'),
    )

    const transcript = await runToolLoop({
      model,
      tools: designTools,
      messages: [new SystemMessage(PLAN_SYSTEM_PROMPT), task],
      logger,
      signal,
    })

    const proposal = await withDesignStructuredOutput(
      model,
      designProposalSchema,
      'design_proposal',
    ).invoke(
        [
          ...transcript,
          new HumanMessage('第二步:按上面取到的模板和设计意图,输出 operations 与 summary。'),
        ],
        { signal },
      )

    logger.info('已生成操作', { count: proposal.operations.length })
    return { proposal }
  }
}
