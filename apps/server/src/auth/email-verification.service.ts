import {
  EMAIL_VERIFICATION_CODE_LENGTH,
  EMAIL_VERIFICATION_CODE_TTL_SECONDS,
  EMAIL_VERIFICATION_RETRY_AFTER_SECONDS,
} from '@ai-design/contracts/auth'
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'

import { MailService } from '../mail/mail.service.js'
import { RedisService } from '../redis/redis.service.js'

const MAX_VERIFICATION_ATTEMPTS = 5
const MAX_EMAILS_PER_CLIENT_WINDOW = 10
const CLIENT_RATE_LIMIT_WINDOW_SECONDS = 10 * 60
type VerificationCodeDelivery = 'deliver' | 'suppress'

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name)

  constructor(
    private readonly redis: RedisService,
    private readonly mail: MailService,
  ) {}

  async issue(email: string, delivery: VerificationCodeDelivery): Promise<void> {
    const emailKey = this.hash(email)
    const codeKey = `auth:email-verification:${emailKey}`
    const cooldownKey = `auth:email-verification-cooldown:${emailKey}`
    const attemptsKey = `auth:email-verification-attempts:${emailKey}`
    const acquired = await this.redis.withClient((client) =>
      client.set(cooldownKey, '1', {
        EX: EMAIL_VERIFICATION_RETRY_AFTER_SECONDS,
        NX: true,
      }),
    )

    if (!acquired) {
      throw new HttpException('验证码发送过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS)
    }

    const code = randomInt(
      10 ** (EMAIL_VERIFICATION_CODE_LENGTH - 1),
      10 ** EMAIL_VERIFICATION_CODE_LENGTH,
    )
      .toString()
      .padStart(EMAIL_VERIFICATION_CODE_LENGTH, '0')

    try {
      await this.redis.withClient(async (client) => {
        await client.set(codeKey, this.hash(`${email}:${code}`), {
          EX: EMAIL_VERIFICATION_CODE_TTL_SECONDS,
        })
        await client.del(attemptsKey)
      })
    } catch (error) {
      await this.redis.withClient((client) => client.del([codeKey, cooldownKey, attemptsKey]))
      throw error
    }

    if (delivery === 'deliver') {
      void this.deliverVerificationCode(email, code, codeKey, cooldownKey, attemptsKey)
    }
  }

  async consumeClientRequest(clientIdentifier: string): Promise<void> {
    const rateLimitKey = `auth:email-verification-client:${this.hash(clientIdentifier)}`
    const requests = await this.redis.incrementFixedWindowCounter(
      rateLimitKey,
      CLIENT_RATE_LIMIT_WINDOW_SECONDS,
    )

    if (requests > MAX_EMAILS_PER_CLIENT_WINDOW) {
      throw new HttpException('验证码请求过多，请稍后再试', HttpStatus.TOO_MANY_REQUESTS)
    }
  }

  async consume(email: string, code: string): Promise<void> {
    const emailKey = this.hash(email)
    const codeKey = `auth:email-verification:${emailKey}`
    const attemptsKey = `auth:email-verification-attempts:${emailKey}`
    const expectedHash = await this.redis.withClient((client) => client.get(codeKey))
    const actualHash = this.hash(`${email}:${code}`)

    if (!expectedHash || !this.matches(expectedHash, actualHash)) {
      await this.recordFailedAttempt(codeKey, attemptsKey)
      throw new BadRequestException('邮箱验证码不正确或已失效')
    }

    const consumedHash = await this.redis.withClient((client) => client.getDel(codeKey))

    if (!consumedHash || !this.matches(consumedHash, actualHash)) {
      throw new BadRequestException('邮箱验证码不正确或已失效')
    }

    await this.redis.withClient((client) => client.del(attemptsKey))
  }

  private async recordFailedAttempt(codeKey: string, attemptsKey: string): Promise<void> {
    const attempts = await this.redis.incrementFixedWindowCounter(
      attemptsKey,
      EMAIL_VERIFICATION_CODE_TTL_SECONDS,
    )

    if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await this.redis.withClient((client) => client.del(codeKey))
    }
  }

  private async deliverVerificationCode(
    email: string,
    code: string,
    codeKey: string,
    cooldownKey: string,
    attemptsKey: string,
  ): Promise<void> {
    try {
      await this.mail.sendVerificationCode(email, code)
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined
      this.logger.error('Failed to deliver email verification code', stack)

      try {
        await this.redis.withClient((client) => client.del([codeKey, cooldownKey, attemptsKey]))
      } catch (cleanupError) {
        const cleanupStack = cleanupError instanceof Error ? cleanupError.stack : undefined
        this.logger.error('Failed to clean up undelivered email verification code', cleanupStack)
      }
    }
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex')
  }

  private matches(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, 'hex')
    const rightBuffer = Buffer.from(right, 'hex')

    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  }
}
