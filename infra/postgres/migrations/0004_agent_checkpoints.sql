-- LangGraph checkpointer tables for @ai-design/agents 的多轮会话。
--
-- DDL 与 @langchain/langgraph-checkpoint-postgres@1.0.4 的 getMigrations() 逐字对应
-- (dist/migrations.js),默认 schema 为 public。
--
-- PostgresSaver.setup() 会读取 checkpoint_migrations 里最大的 v,只应用比它更新的迁移。
-- 所以这里把 v0..v4 一并写入 —— setup() 之后变成 no-op,建表始终由本文件负责,
-- 符合 AGENTS.md「migrations 是数据库结构的权威来源」。
--
-- 升级 checkpoint-postgres 时:比对新版 getMigrations() 的数组长度,
-- 多出来的迁移追加成新的 SQL 文件,并把对应的 v 写进 checkpoint_migrations。

CREATE TABLE IF NOT EXISTS checkpoint_migrations (
  v INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS checkpoints (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  parent_checkpoint_id TEXT,
  type TEXT,
  checkpoint JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

-- blob 可为空 —— 上游 v4 迁移把 NOT NULL 去掉了,这里直接建成可空。
CREATE TABLE IF NOT EXISTS checkpoint_blobs (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL,
  version TEXT NOT NULL,
  type TEXT NOT NULL,
  blob BYTEA,
  PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
);

CREATE TABLE IF NOT EXISTS checkpoint_writes (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  channel TEXT NOT NULL,
  type TEXT,
  blob BYTEA NOT NULL,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);

-- 标记上游 v0..v4 已应用,让 setup() 成为 no-op。
INSERT INTO checkpoint_migrations (v)
VALUES (0), (1), (2), (3), (4)
ON CONFLICT (v) DO NOTHING;

INSERT INTO schema_migrations (version) VALUES (:'migration_version');
