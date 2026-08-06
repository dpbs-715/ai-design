import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Pool } from 'pg'
import type { PoolClient, QueryConfigValues, QueryResult, QueryResultRow } from 'pg'

import type { EnvironmentVariables } from '../config/environment.js'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name)
  private readonly pool: Pool

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.pool = new Pool({
      host: config.get('POSTGRES_HOST', { infer: true }),
      port: config.get('POSTGRES_PORT', { infer: true }),
      database: config.get('POSTGRES_DB', { infer: true }),
      user: config.get('POSTGRES_USER', { infer: true }),
      password: config.get('POSTGRES_PASSWORD', { infer: true }),
      connectionTimeoutMillis: 3_000,
      idleTimeoutMillis: 30_000,
    })

    this.pool.on('error', (error) => {
      this.logger.error('PostgreSQL idle client error', error.stack)
    })
  }

  /**
   * 暴露连接池给需要自带 SQL 层的库(例如 LangGraph 的 PostgresSaver),
   * 避免为它们再开一份连接池。日常查询请用 `query` / `withTransaction`。
   */
  get connectionPool(): Pool {
    return this.pool
  }

  query<Row extends QueryResultRow = QueryResultRow>(
    statement: string,
    values?: QueryConfigValues<unknown[]>,
  ): Promise<QueryResult<Row>> {
    return this.pool.query<Row, unknown[]>(statement, values)
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1')
  }

  async withTransaction<Result>(
    operation: (client: PoolClient) => Promise<Result>,
  ): Promise<Result> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')
      const result = await operation(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }
}
