import { SESSION_TTL_SECONDS } from '@ai-design/contracts/auth'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash, randomBytes } from 'node:crypto'
import type { CookieOptions } from 'express'

import type { EnvironmentVariables } from '../config/environment.js'
import { RedisService } from '../redis/redis.service.js'

export const SESSION_COOKIE_NAME = 'ai_design_session'

@Injectable()
export class SessionService {
  private readonly secureCookie: boolean

  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly redis: RedisService,
  ) {
    this.secureCookie = config.get('NODE_ENV', { infer: true }) === 'production'
  }

  async create(userId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url')

    await this.redis.withClient((client) =>
      client.set(this.getSessionKey(token), userId, {
        EX: SESSION_TTL_SECONDS,
      }),
    )

    return token
  }

  async findUserId(token: string): Promise<string | null> {
    return this.redis.withClient((client) => client.get(this.getSessionKey(token)))
  }

  async destroy(token: string): Promise<void> {
    await this.redis.withClient((client) => client.del(this.getSessionKey(token)))
  }

  getCookieOptions(): CookieOptions {
    return {
      ...this.getBaseCookieOptions(),
      maxAge: SESSION_TTL_SECONDS * 1_000,
    }
  }

  getClearCookieOptions(): CookieOptions {
    return this.getBaseCookieOptions()
  }

  private getSessionKey(token: string): string {
    return `auth:session:${createHash('sha256').update(token).digest('hex')}`
  }

  private getBaseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secureCookie,
      sameSite: 'lax',
      path: '/api',
    }
  }
}
