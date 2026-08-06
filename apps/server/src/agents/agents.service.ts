import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  createAgentRuntime,
  createChatModel,
  createPostgresCheckpointer,
  type AgentRuntime,
  type AgentStreamEvent,
  type PageDesignResult,
} from '@ai-design/agents'
import type { AgentLogger } from '@ai-design/agents'
import type { EnvironmentVariables } from '../config/environment.js'
import { DatabaseService } from '../database/database.service.js'
import { WorkspaceAccessService } from '../workspace/workspace-access.service.js'
import type { PageDesignRequest } from './agents.dto.js'

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name)
  private readonly runtime: AgentRuntime

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly access: WorkspaceAccessService,
    database: DatabaseService,
  ) {
    // 复用 DatabaseService 的连接池 —— PostgresSaver 接受外部 Pool,不额外开一份。
    // 建表由 infra/postgres/migrations/0004_agent_checkpoints.sql 负责,不调 setup()。
    this.runtime = createAgentRuntime({
      checkpointer: createPostgresCheckpointer(database.connectionPool),
    })
  }

  /**
   * 生成页面修改方案。
   *
   * 只返回预览页面 —— 落库要走 workspace 既有的保存接口,那条路径已经处理了
   * revision 乐观锁与冲突区分。
   */
  async designPage(
    userId: string,
    projectId: string,
    request: PageDesignRequest,
    signal?: AbortSignal,
  ): Promise<PageDesignResult> {
    await this.access.requireProjectAccess(userId, projectId, 'write')
    return this.runtime.invoke('page-design', this.toInput(request), this.buildContext(), {
      ...(signal ? { signal } : {}),
      ...(request.threadId ? { threadId: request.threadId } : {}),
    })
  }

  /** 流式生成,供 SSE 接口使用。 */
  async streamPageDesign(
    userId: string,
    projectId: string,
    request: PageDesignRequest,
    signal?: AbortSignal,
  ): Promise<AsyncIterable<AgentStreamEvent>> {
    await this.access.requireProjectAccess(userId, projectId, 'write')
    return this.runtime.stream('page-design', this.toInput(request), this.buildContext(), {
      ...(signal ? { signal } : {}),
      ...(request.threadId ? { threadId: request.threadId } : {}),
    })
  }

  private toInput(request: PageDesignRequest) {
    return {
      request: request.request,
      page: request.page,
      ...(request.selectedNodeIds ? { selectedNodeIds: request.selectedNodeIds } : {}),
    }
  }

  private buildContext() {
    const agentLogger: AgentLogger = {
      debug: (message, meta) => this.logger.debug(this.format(message, meta)),
      info: (message, meta) => this.logger.log(this.format(message, meta)),
      warn: (message, meta) => this.logger.warn(this.format(message, meta)),
      error: (message, meta) => this.logger.error(this.format(message, meta)),
    }

    return {
      model: createChatModel({
        apiKey: this.config.get('AGENT_MODEL_API_KEY', { infer: true }),
        model: this.config.get('AGENT_MODEL_NAME', { infer: true }),
        baseURL: this.config.get('AGENT_MODEL_BASE_URL', { infer: true }),
        timeoutMs: this.config.get('AGENT_MODEL_TIMEOUT_MS', { infer: true }),
        maxRetries: 1,
      }),
      logger: agentLogger,
    }
  }

  private format(message: string, meta?: Record<string, unknown>) {
    return meta ? `${message} ${JSON.stringify(meta)}` : message
  }
}
