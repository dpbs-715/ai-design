import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

import type { EnvironmentVariables } from '../config/environment.js'

const INCREMENT_FIXED_WINDOW_COUNTER_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private readonly client: ReturnType<typeof createClient>
  private connectPromise: Promise<void> | undefined

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.client = createClient({
      socket: {
        host: config.get('REDIS_HOST', { infer: true }),
        port: config.get('REDIS_PORT', { infer: true }),
        connectTimeout: 3_000,
        reconnectStrategy: (retries) =>
          retries < 3 ? Math.min(100 * 2 ** retries, 1_000) : new Error('Redis unavailable'),
      },
      username: config.get('REDIS_USERNAME', { infer: true }),
      password: config.get('REDIS_PASSWORD', { infer: true }),
      keyPrefix: 'ai-design:',
      name: 'ai-design-server',
      disableOfflineQueue: true,
    })

    this.client.on('error', (error) => {
      this.logger.error('Redis client error', error.stack)
    })
  }

  async withClient<Result>(
    operation: (client: ReturnType<typeof createClient>) => Promise<Result>,
  ): Promise<Result> {
    await this.ensureConnected()
    return operation(this.client)
  }

  async ping(): Promise<void> {
    await this.withClient((client) => client.ping()).then(() => undefined)
  }

  async incrementFixedWindowCounter(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.withClient((client) =>
      client.eval(INCREMENT_FIXED_WINDOW_COUNTER_SCRIPT, {
        keys: [key],
        arguments: [String(ttlSeconds)],
      }),
    )

    if (typeof count !== 'number') {
      throw new Error('Redis fixed-window counter returned an invalid result')
    }

    return count
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close()
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isReady) {
      return
    }

    if (!this.connectPromise) {
      if (this.client.isOpen) {
        throw new Error('Redis client is reconnecting')
      }

      const connection = this.client.connect().then(() => undefined)
      this.connectPromise = connection

      void connection.then(
        () => this.clearConnectPromise(connection),
        () => this.clearConnectPromise(connection),
      )
    }

    await this.connectPromise
  }

  private clearConnectPromise(connection: Promise<void>): void {
    if (this.connectPromise === connection) {
      this.connectPromise = undefined
    }
  }
}
