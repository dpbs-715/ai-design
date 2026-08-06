import type { DesignOperation } from './schemas.js'

/**
 * 操作级错误 —— 定位到 operations 数组里的具体下标。
 */
export interface DesignOperationError {
  kind: 'operation'
  index: number
  operationType: DesignOperation['type']
  message: string
}

/**
 * 方案级错误 —— 不属于任何单个操作,比如没有生成操作、或输入页面本身不合法。
 * 旧实现把这类错误硬塞成 `{ index: -1, operationType: 'add-node' }`,
 * 那是往数据模型里写假话。
 */
export interface DesignProposalError {
  kind: 'proposal'
  message: string
}

export type DesignError = DesignOperationError | DesignProposalError

export function operationError(
  index: number,
  operationType: DesignOperation['type'],
  message: string,
): DesignOperationError {
  return { kind: 'operation', index, operationType, message }
}

export function proposalError(message: string): DesignProposalError {
  return { kind: 'proposal', message }
}
