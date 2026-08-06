import type { PageDesignGraphState } from './state.js'

/** 最多修复两次,避免无限循环。 */
export const MAX_REPAIR_COUNT = 2

export type ApplyRoute = 'repair' | 'done'

/** 校验失败且还有修复余额时走 repair,否则结束。 */
export function routeAfterApply(state: PageDesignGraphState): ApplyRoute {
  if (state.errors.length === 0) return 'done'
  return state.repairCount < MAX_REPAIR_COUNT ? 'repair' : 'done'
}
