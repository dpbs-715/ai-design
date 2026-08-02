import {
  EMAIL_VERIFICATION_CODE_TTL_SECONDS,
  EMAIL_VERIFICATION_RETRY_AFTER_SECONDS,
} from '@ai-design/contracts/auth'
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  SendEmailVerificationCodeResponse,
} from '@ai-design/contracts/auth'
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { AuthRepository } from './auth.repository.js'
import { EmailVerificationService } from './email-verification.service.js'
import { LoginThrottleService } from './login-throttle.service.js'
import { PasswordService } from './password.service.js'
import { SessionService } from './session.service.js'

export interface AuthenticatedSession extends AuthResponse {
  sessionToken: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly emailVerification: EmailVerificationService,
    private readonly loginThrottle: LoginThrottleService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  async sendEmailVerificationCode(
    email: string,
    clientIdentifier: string,
  ): Promise<SendEmailVerificationCodeResponse> {
    await this.emailVerification.consumeClientRequest(clientIdentifier)
    const delivery = (await this.repository.emailExists(email)) ? 'suppress' : 'deliver'
    await this.emailVerification.issue(email, delivery)

    return {
      expiresInSeconds: EMAIL_VERIFICATION_CODE_TTL_SECONDS,
      retryAfterSeconds: EMAIL_VERIFICATION_RETRY_AFTER_SECONDS,
    }
  }

  async register(request: RegisterRequest): Promise<AuthenticatedSession> {
    await this.emailVerification.consume(request.email, request.verificationCode)
    const passwordHash = await this.passwords.hash(request.password)
    const user = await this.repository.createUser(request.email, request.displayName, passwordHash)

    if (!user) {
      throw new ConflictException('该邮箱已经注册')
    }

    const sessionToken = await this.sessions.create(user.id)
    return { user, sessionToken }
  }

  async login(request: LoginRequest, clientIdentifier: string): Promise<AuthenticatedSession> {
    await this.loginThrottle.consume(request.email, clientIdentifier)
    const account = await this.repository.findLoginAccount(request.email)
    const passwordMatches = await this.passwords.verifyOrDummy(
      request.password,
      account?.passwordHash,
    )

    if (!account) {
      throw new UnauthorizedException('邮箱或密码不正确')
    }

    if (!passwordMatches) {
      throw new UnauthorizedException('邮箱或密码不正确')
    }

    if (account.status === 'disabled') {
      throw new ForbiddenException('账户已被停用')
    }

    await this.loginThrottle.resetAfterSuccessfulLogin(request.email, clientIdentifier)
    await this.repository.recordSuccessfulLogin(account.id)
    const sessionToken = await this.sessions.create(account.id)

    return {
      user: this.toAuthUser(account),
      sessionToken,
    }
  }

  private toAuthUser(user: AuthUser): AuthUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
    }
  }
}
