import type { AgentName } from '../graphs/registry.js'

export type AgentStreamEvent =
  /** 某个节点产出了状态更新。 */
  | { type: 'node'; agent: AgentName; node: string; data: unknown }
  /** 图正常结束,附带最终结果 —— 消费方不必从 node data 里刨。 */
  | { type: 'completed'; agent: AgentName; result: unknown }
  /** 调用方主动取消。 */
  | { type: 'aborted'; agent: AgentName }
  /** 运行出错。 */
  | { type: 'failed'; agent: AgentName; message: string }
