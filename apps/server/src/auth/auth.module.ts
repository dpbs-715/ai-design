import { Module } from '@nestjs/common'

import { DatabaseModule } from '../database/database.module.js'
import { MailModule } from '../mail/mail.module.js'
import { RedisModule } from '../redis/redis.module.js'
import { AuthController } from './auth.controller.js'
import { AuthRepository } from './auth.repository.js'
import { AuthService } from './auth.service.js'
import { EmailVerificationService } from './email-verification.service.js'
import { LoginThrottleService } from './login-throttle.service.js'
import { PasswordService } from './password.service.js'
import { SessionAuthGuard } from './session-auth.guard.js'
import { SessionService } from './session.service.js'

@Module({
  imports: [DatabaseModule, RedisModule, MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordService,
    EmailVerificationService,
    LoginThrottleService,
    SessionService,
    SessionAuthGuard,
  ],
})
export class AuthModule {}
