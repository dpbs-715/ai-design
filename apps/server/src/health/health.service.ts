import { Injectable, ServiceUnavailableException } from '@nestjs/common'

import { DatabaseService } from '../database/database.service.js'
import { RedisService } from '../redis/redis.service.js'

type DependencyStatus = 'up' | 'down'

export interface ReadinessResult {
  status: 'ok' | 'error'
  checks: {
    postgres: DependencyStatus
    redis: DependencyStatus
  }
}

@Injectable()
export class HealthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getReadiness(): Promise<ReadinessResult> {
    const [postgres, redis] = await Promise.all([
      this.check(() => this.database.ping()),
      this.check(() => this.redis.ping()),
    ])
    const result: ReadinessResult = {
      status: postgres === 'up' && redis === 'up' ? 'ok' : 'error',
      checks: { postgres, redis },
    }

    if (result.status === 'error') {
      throw new ServiceUnavailableException(result)
    }

    return result
  }

  private async check(operation: () => Promise<void>): Promise<DependencyStatus> {
    try {
      await operation()
      return 'up'
    } catch {
      return 'down'
    }
  }
}
