import { Body, Controller, Param, ParseUUIDPipe, Post, Req, Sse, UseGuards } from '@nestjs/common'
import { from } from 'rxjs'
import type { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { AgentStreamEvent, PageDesignResult } from '@ai-design/agents'
import type { AuthenticatedRequest } from '../auth/authenticated-request.js'
import { SessionAuthGuard } from '../auth/session-auth.guard.js'
import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import { AgentsService } from './agents.service.js'
import { pageDesignRequestSchema } from './agents.dto.js'
import type { PageDesignRequest } from './agents.dto.js'

/** Nest 的 SSE 返回类型。 */
interface MessageEvent {
  data: string
}

@Controller()
@UseGuards(SessionAuthGuard)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  /** 一次性返回设计方案。 */
  @Post('projects/:projectId/agents/page-design')
  designPage(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ZodValidationPipe(pageDesignRequestSchema)) body: PageDesignRequest,
  ): Promise<PageDesignResult> {
    return this.agents.designPage(request.auth.userId, projectId, body)
  }

  /**
   * 流式返回执行过程。
   *
   * 浏览器原生 EventSource 不能带自定义头,但会带 cookie —— 会话 cookie 的
   * path 是 `/api`,所以 SessionAuthGuard 在这条路由上同样生效。
   */
  @Sse('projects/:projectId/agents/page-design/stream')
  async streamPageDesign(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ZodValidationPipe(pageDesignRequestSchema)) body: PageDesignRequest,
  ): Promise<Observable<MessageEvent>> {
    const events = await this.agents.streamPageDesign(request.auth.userId, projectId, body)
    return from(events).pipe(
      map((event: AgentStreamEvent) => ({ data: JSON.stringify(event) })),
    )
  }
}
