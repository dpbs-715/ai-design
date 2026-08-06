import type { RunnableConfig } from '@langchain/core/runnables'
import { applyDesignOperations } from '../../../core/operations/apply.js'
import { proposalError } from '../../../core/operations/errors.js'
import { contextFromConfig } from '../../../core/runtime/context.js'
import type { PageDesignContext } from '../context.js'
import type { PageDesignGraphState } from '../state.js'

/**
 * 校验并应用操作。
 *
 * 旧实现把这一步拆成 validate 和 preview 两个节点,各自跑一遍校验。
 * `applyDesignOperations` 已经是「边推进边校验」的单一入口,所以这里只有一个节点。
 */
export function createApplyNode() {
  return async (state: PageDesignGraphState, config: RunnableConfig) => {
    const { logger } = contextFromConfig<PageDesignContext>(config)

    if (!state.proposal) {
      return { errors: [proposalError('模型没有给出任何修改操作')] }
    }

    const result = applyDesignOperations(state.page, state.proposal.operations)
    if (result.errors.length > 0) {
      logger.warn('操作校验未通过', { errorCount: result.errors.length })
      return { errors: result.errors, previewPage: undefined }
    }

    logger.info('操作已应用', { count: state.proposal.operations.length })
    return { errors: [], previewPage: result.page }
  }
}
