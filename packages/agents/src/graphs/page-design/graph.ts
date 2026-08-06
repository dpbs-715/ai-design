import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { createApplyNode } from './nodes/apply.js'
import { createPlanNode } from './nodes/plan.js'
import { createRepairNode } from './nodes/repair.js'
import { createUnderstandNode } from './nodes/understand.js'
import { routeAfterApply } from './routes.js'
import { PageDesignStateAnnotation } from './state.js'

export interface CreatePageDesignGraphOptions {
  /** 传入 checkpointer 以启用多轮会话。 */
  checkpointer?: BaseCheckpointSaver
}

/**
 * understand → plan → apply,校验失败时最多修复两次。
 *
 * 旧实现有独立的 validate 与 preview 两个节点、各跑一遍校验;
 * `applyDesignOperations` 已经把校验和应用合成单一入口,所以这里合并成 apply。
 */
export function createPageDesignGraph(options: CreatePageDesignGraphOptions = {}) {
  const graph = new StateGraph(PageDesignStateAnnotation)
    .addNode('understand', createUnderstandNode())
    .addNode('plan', createPlanNode())
    .addNode('apply', createApplyNode())
    .addNode('repair', createRepairNode())
    .addEdge(START, 'understand')
    .addEdge('understand', 'plan')
    .addEdge('plan', 'apply')
    .addConditionalEdges('apply', routeAfterApply, {
      repair: 'repair',
      done: END,
    })
    .addEdge('repair', 'apply')

  return graph.compile(options.checkpointer ? { checkpointer: options.checkpointer } : {})
}
