import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ACCOUNT_DISABLED_ERROR_CODE } from '@ai-design/contracts/auth'
import type { Request, Response } from 'express'

import type { AuthenticatedRequest } from './authenticated-request.js'
import { AuthRepository } from './auth.repository.js'
import { SESSION_COOKIE_NAME, SessionService } from './session.service.js'

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly logger = new Logger(SessionAuthGuard.name)

  constructor(
    private readonly sessions: SessionService,
    private readonly users: AuthRepository,
  ) {}

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

    const user = await this.users.findUserById(userId)
    if (!user) {
      await this.invalidateSession(context, sessionToken)
      throw new UnauthorizedException('登录状态已失效')
    }
    if (user.status === 'disabled') {
      await this.invalidateSession(context, sessionToken)
      throw new ForbiddenException({
        code: ACCOUNT_DISABLED_ERROR_CODE,
        message: '账户已被停用',
      })
    }

    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.auth = { userId, sessionToken, user }
    return true
  }

  private async invalidateSession(context: ExecutionContext, sessionToken: string): Promise<void> {
    const response = context.switchToHttp().getResponse<Response>()
    response.clearCookie(SESSION_COOKIE_NAME, this.sessions.getClearCookieOptions())

    try {
      await this.sessions.destroy(sessionToken)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to destroy invalid session: ${message}`)
    }
  }
}
