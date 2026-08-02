import {
  loginRequestSchema,
  registerRequestSchema,
  sendEmailVerificationCodeRequestSchema,
} from '@ai-design/contracts/auth'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SendEmailVerificationCodeRequest,
  SendEmailVerificationCodeResponse,
} from '@ai-design/contracts/auth'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'

import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import type { AuthenticatedRequest } from './authenticated-request.js'
import { AuthService } from './auth.service.js'
import { SessionAuthGuard } from './session-auth.guard.js'
import { SESSION_COOKIE_NAME, SessionService } from './session.service.js'

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('email-verification-codes')
  @HttpCode(HttpStatus.ACCEPTED)
  sendEmailVerificationCode(
    @Body(new ZodValidationPipe(sendEmailVerificationCodeRequestSchema))
    request: SendEmailVerificationCodeRequest,
    @Req() httpRequest: Request,
  ): Promise<SendEmailVerificationCodeResponse> {
    const clientIdentifier = httpRequest.ip ?? httpRequest.socket.remoteAddress ?? 'unknown'
    return this.auth.sendEmailVerificationCode(request.email, clientIdentifier)
  }

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerRequestSchema)) request: RegisterRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const { sessionToken, ...authResponse } = await this.auth.register(request)
    response.cookie(SESSION_COOKIE_NAME, sessionToken, this.sessions.getCookieOptions())
    return authResponse
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) request: LoginRequest,
    @Req() httpRequest: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const clientIdentifier = httpRequest.ip ?? httpRequest.socket.remoteAddress ?? 'unknown'
    const { sessionToken, ...authResponse } = await this.auth.login(request, clientIdentifier)
    response.cookie(SESSION_COOKIE_NAME, sessionToken, this.sessions.getCookieOptions())
    return authResponse
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest): AuthResponse {
    return { user: request.auth.user }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME]
    response.clearCookie(SESSION_COOKIE_NAME, this.sessions.getClearCookieOptions())

    if (typeof sessionToken === 'string' && sessionToken.length > 0) {
      try {
        await this.sessions.destroy(sessionToken)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.warn(`Failed to destroy session during logout: ${message}`)
      }
    }
  }
}
