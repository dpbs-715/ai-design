import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module.js'
import { DatabaseModule } from '../database/database.module.js'
import { WorkspaceModule } from '../workspace/workspace.module.js'
import { AgentsController } from './agents.controller.js'
import { AgentsService } from './agents.service.js'

/**
 * agents 不读写 pages 表 —— 页面保存走 workspace 既有的接口(已处理 revision 乐观锁)。
 * 这里用 DatabaseModule 只为把连接池交给 LangGraph 的 checkpointer(多轮会话),
 * 用 WorkspaceModule 做项目权限校验。
 */
@Module({
  imports: [AuthModule, DatabaseModule, WorkspaceModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
