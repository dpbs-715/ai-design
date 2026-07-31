import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

import type { EnvironmentVariables } from '../config/environment'

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
      name: 'ai-design-api',
      disableOfflineQueue: true,
    })

    this.client.on('error', (error) => {
      this.logger.error('Redis client error', error.stack)
    })
  }

  getClient(): ReturnType<typeof createClient> {
    return this.client
  }

  async ping(): Promise<void> {
    await this.ensureConnected()
    await this.client.ping()
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close()
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) {
      return
    }

    if (!this.connectPromise) {
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
