import { defineStore } from 'pinia'

import { streamPageDesign, type DesignError, type PageDesignResult } from '@/agent/api.ts'
import { parsePageSchema } from '@/schema/validation.ts'
import { useEditorStore } from '@/stores/editor.ts'

/** 执行阶段。与图节点名对应,用于展示进度。 */
export type AgentStage = 'understand' | 'plan' | 'apply' | 'repair'

const stageLabels: Record<AgentStage, string> = {
  understand: '理解需求',
  plan: '规划操作',
  apply: '校验并应用',
  repair: '修正操作',
}

export function getStageLabel(stage: string): string {
  return stageLabels[stage as AgentStage] ?? stage
}

export interface AgentUserTurn {
  id: string
  role: 'user'
  text: string
}

export interface AgentReplyTurn {
  id: string
  role: 'agent'
  /** 已经历的阶段,按发生顺序。 */
  stages: string[]
  status: 'streaming' | 'succeeded' | 'failed' | 'aborted'
  /** 成功时的方案摘要。 */
  summary?: string
  operationCount?: number
  errors?: DesignError[]
  /** 失败原因(网络/服务端错误,与 errors 的校验失败不同)。 */
  message?: string
  /** 方案是否已应用到画布。 */
  applied?: boolean
  /** 新增的节点数,应用后已在画布上选中。 */
  addedCount?: number
}

export type AgentTurn = AgentUserTurn | AgentReplyTurn

export const useAgentChatStore = defineStore('agentChat', () => {
  const editorStore = useEditorStore()

  const turns = ref<AgentTurn[]>([])
  const streaming = ref(false)
  /**
   * 会话线程 id。前端生成 —— checkpointer 对未知 thread_id 自然创建,
   * 不需要多一次往返向服务端申请。
   */
  const threadId = ref(crypto.randomUUID())
  let controller: AbortController | undefined

  const canSend = computed(() => !streaming.value)

  function findReply(id: string) {
    return turns.value.find(
      (turn): turn is AgentReplyTurn => turn.role === 'agent' && turn.id === id,
    )
  }

  async function send(projectId: string, text: string) {
    const request = text.trim()
    if (!request || streaming.value) return

    turns.value.push({ id: crypto.randomUUID(), role: 'user', text: request })
    const replyId = crypto.randomUUID()
    turns.value.push({ id: replyId, role: 'agent', stages: [], status: 'streaming' })

    streaming.value = true
    controller = new AbortController()

    try {
      const events = streamPageDesign({
        projectId,
        request,
        page: editorStore.page,
        selectedNodeIds: editorStore.selectedNodeIds,
        threadId: threadId.value,
        signal: controller.signal,
      })

      for await (const event of events) {
        const reply = findReply(replyId)
        if (!reply) break

        if (event.type === 'node') {
          reply.stages.push(event.node)
        } else if (event.type === 'completed') {
          applyResult(reply, event.result)
        } else if (event.type === 'aborted') {
          reply.status = 'aborted'
        } else {
          reply.status = 'failed'
          reply.message = event.message
        }
      }
    } catch (error) {
      const reply = findReply(replyId)
      if (reply) {
        // 主动取消走 AbortError,不算失败。
        const aborted = error instanceof Error && error.name === 'AbortError'
        reply.status = aborted ? 'aborted' : 'failed'
        if (!aborted) {
          reply.message = error instanceof Error ? error.message : '执行失败'
        }
      }
    } finally {
      streaming.value = false
      controller = undefined
      // 流意外中断时状态可能还停在 streaming,补一个终态,避免 UI 一直转圈。
      const reply = findReply(replyId)
      if (reply?.status === 'streaming') {
        reply.status = 'failed'
        reply.message = reply.message ?? '连接中断'
      }
    }
  }

  /**
   * 结果落到会话记录并自动应用。
   *
   * 直接应用而不是等用户点确认:改动进了撤销栈,Ctrl+Z 就能退回,
   * 比先弹预览再确认少一步。
   */
  function applyResult(reply: AgentReplyTurn, result: PageDesignResult) {
    reply.summary = result.summary
    reply.operationCount = result.operations.length
    reply.errors = result.errors

    if (!result.ok || !result.previewPage) {
      reply.status = 'failed'
      return
    }

    // previewPage 来自模型,必须校验后才能进编辑器状态。
    const parsed = parsePageSchema(result.previewPage)
    if (parsed.success === false) {
      reply.status = 'failed'
      reply.message = parsed.issues[0]?.message ?? '生成的页面不符合 Schema'
      return
    }

    const addedIds = editorStore.applyAgentPage(parsed.data)
    reply.status = 'succeeded'
    reply.applied = true
    reply.addedCount = addedIds.length
  }

  /** 中止当前执行。服务端监听 response close,会同步停止图执行。 */
  function cancel() {
    controller?.abort()
  }

  /** 清空会话。换新线程,让模型不再延续旧上下文。 */
  function reset() {
    cancel()
    turns.value = []
    threadId.value = crypto.randomUUID()
  }

  return {
    turns,
    streaming,
    canSend,
    send,
    cancel,
    reset,
  }
})
