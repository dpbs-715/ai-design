import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'

import { RedisService } from '../redis/redis.service.js'

const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 10 * 60
const MAX_LOGIN_ATTEMPTS_PER_CLIENT = 30
const MAX_LOGIN_ATTEMPTS_PER_ACCOUNT_CLIENT = 8

@Injectable()
export class LoginThrottleService {
  constructor(private readonly redis: RedisService) {}

  async consume(email: string, clientIdentifier: string): Promise<void> {
    const clientKey = `auth:login-client:${this.hash(clientIdentifier)}`
    const accountClientKey = `auth:login-account-client:${this.hash(
      `${email}:${clientIdentifier}`,
    )}`
    const [clientAttempts, accountClientAttempts] = await Promise.all([
      this.redis.incrementFixedWindowCounter(clientKey, LOGIN_RATE_LIMIT_WINDOW_SECONDS),
      this.redis.incrementFixedWindowCounter(accountClientKey, LOGIN_RATE_LIMIT_WINDOW_SECONDS),
    ])

    if (
      clientAttempts > MAX_LOGIN_ATTEMPTS_PER_CLIENT ||
      accountClientAttempts > MAX_LOGIN_ATTEMPTS_PER_ACCOUNT_CLIENT
    ) {
      throw new HttpException('登录尝试过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS)
    }
  }

  async resetAccountClient(email: string, clientIdentifier: string): Promise<void> {
    const accountClientKey = `auth:login-account-client:${this.hash(
      `${email}:${clientIdentifier}`,
    )}`
    await this.redis.withClient((client) => client.del(accountClientKey))
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex')
  }
}
