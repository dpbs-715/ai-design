import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

import type { AuthenticatedRequest } from './authenticated-request.js'
import { SESSION_COOKIE_NAME, SessionService } from './session.service.js'

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME]

    if (typeof sessionToken !== 'string' || sessionToken.length === 0) {
      throw new UnauthorizedException('请先登录')
    }

    const userId = await this.sessions.findUserId(sessionToken)

    if (!userId) {
      throw new UnauthorizedException('登录状态已失效')
    }

    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.auth = { userId, sessionToken }
    return true
  }
}
