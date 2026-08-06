import { createPageDesignGraph } from './page-design/graph.js'
import { toPageDesignResult } from './page-design/result.js'
import type { PageDesignContext } from './page-design/context.js'
import type { PageDesignInput, PageDesignResult } from './page-design/input.js'
import type { PageDesignGraphState } from './page-design/state.js'

/**
 * Agent 登记表。
 *
 * 每个条目自带 resultMapper —— runtime 门面因此不需要认识任何具体的 graph,
 * 新增 agent 只改这个文件。
 */
export const agentRegistry = {
  'page-design': {
    createGraph: createPageDesignGraph,
    toResult: (state: unknown) => toPageDesignResult(state as PageDesignGraphState),
  },
} as const

export type AgentName = keyof typeof agentRegistry

export interface AgentIOMap {
  'page-design': {
    input: PageDesignInput
    output: PageDesignResult
  }
}

export interface AgentContextMap {
  'page-design': PageDesignContext
}
