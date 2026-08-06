import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import type pg from 'pg'

/**
 * 用现有的 pg 连接池创建 checkpointer。
 *
 * `PostgresSaver` 的构造函数接受外部 Pool,所以这里复用 server 的 DatabaseService,
 * 不额外开一份连接池。
 *
 * **不要调用 `setup()`** —— 建表由 `infra/postgres/migrations/0004_agent_checkpoints.sql`
 * 负责(migrations 是数据库结构的权威来源)。该迁移把上游的 v0..v4 写进
 * checkpoint_migrations,所以即便误调 setup() 也是 no-op。
 */
export function createPostgresCheckpointer(pool: pg.Pool): BaseCheckpointSaver {
  return new PostgresSaver(pool)
}
