import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { designProposalSchema } from '../../../core/operations/schemas.js'
import { contextFromConfig } from '../../../core/runtime/context.js'
import { formatPageOutline } from '../../../core/tree/outline.js'
import { withDesignStructuredOutput } from '../../../llm/structured-output.js'
import type { PageDesignContext } from '../context.js'
import { REPAIR_SYSTEM_PROMPT } from '../prompts.js'
import type { PageDesignGraphState } from '../state.js'

/** 根据校验错误修正上一轮的 operations。 */
export function createRepairNode() {
  return async (state: PageDesignGraphState, config: RunnableConfig) => {
    const { model, logger, signal } = contextFromConfig<PageDesignContext>(config)
    const attempt = state.repairCount + 1
    logger.info('修复修改操作', { attempt })

    const proposal = await withDesignStructuredOutput(
      model,
      designProposalSchema,
      'design_proposal',
    ).invoke(
        [
          new SystemMessage(REPAIR_SYSTEM_PROMPT),
          new HumanMessage(
            [
              `页面结构:\n${formatPageOutline(state.page)}`,
              `上一次的操作:\n${JSON.stringify(state.proposal?.operations ?? [], null, 2)}`,
              `校验错误:\n${JSON.stringify(state.errors, null, 2)}`,
            ].join('\n\n'),
          ),
        ],
        { signal },
      )

    return { proposal, repairCount: attempt }
  }
}
