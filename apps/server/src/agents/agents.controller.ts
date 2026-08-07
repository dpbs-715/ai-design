import { Body, Controller, Param, ParseUUIDPipe, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import type { PageDesignResult } from '@ai-design/agents'
import type { AuthenticatedRequest } from '../auth/authenticated-request.js'
import { SessionAuthGuard } from '../auth/session-auth.guard.js'
import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import { AgentsService } from './agents.service.js'
import { pageDesignRequestSchema } from './agents.dto.js'
import type { PageDesignRequest } from './agents.dto.js'
import { writeSseStream } from './sse-stream.js'

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
   * 用 POST 手写 SSE 而不用 Nest 的 `@Sse`(它注册的是 GET):请求体要带
   * 整个页面草稿,原生 EventSource 既发不了 body 也带不了自定义头。前端用
   * fetch 读 ReadableStream,断开即取消 —— 服务端不必维护 run 生命周期。
   */
  @Post('projects/:projectId/agents/page-design/stream')
  async streamPageDesign(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ZodValidationPipe(pageDesignRequestSchema)) body: PageDesignRequest,
    @Res() response: Response,
  ): Promise<void> {
    // 客户端断开时中止图执行,否则模型会把剩下的节点跑完,白烧 token。
    //
    // 监听 response 而不是 request:body parser 已经读完请求体,request 流早已结束,
    // 不会再有 close 事件 —— 挂在 request 上等于永远不触发。
    const controller = new AbortController()
    response.on('close', () => controller.abort())

    // 鉴权与参数校验都要在 writeSseStream 写出 200 头之前完成,
    // 否则失败就只能表达成响应体里的事件,前端得处理两套错误路径。
    const events = await this.agents.streamPageDesign(
      request.auth.userId,
      projectId,
      body,
      controller.signal,
    )
    await writeSseStream(response, events)
  }
}
