import type { TrashResourceType, TrashResponse } from '@ai-design/contracts/workspace'
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { EnvironmentVariables } from '../config/environment.js'
import { TrashRepository } from './trash.repository.js'
import { WorkspaceAccessService } from './workspace-access.service.js'
import { postgresCode } from './workspace-errors.js'

const TRASH_CLEANUP_INTERVAL_MS = 60 * 60 * 1_000

@Injectable()
export class TrashService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrashService.name)
  private readonly retentionDays: number
  private cleanupTimer?: NodeJS.Timeout

  constructor(
    private readonly repository: TrashRepository,
    private readonly access: WorkspaceAccessService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.retentionDays = config.get('TRASH_RETENTION_DAYS', { infer: true })
  }

  onModuleInit(): void {
    this.cleanupTimer = setInterval(() => {
      void this.purgeExpired().catch((error: unknown) => {
        this.logger.error('Failed to purge expired trash items', error)
      })
    }, TRASH_CLEANUP_INTERVAL_MS)
    this.cleanupTimer.unref()
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)
  }

  async listItems(userId: string, workspaceId: string): Promise<TrashResponse> {
    await this.access.requireWorkspaceAccess(userId, workspaceId)
    await this.purgeExpired()
    return {
      retentionDays: this.retentionDays,
      items: await this.repository.listItems(workspaceId, this.retentionDays),
    }
  }

  async restore(
    userId: string,
    workspaceId: string,
    type: TrashResourceType,
    resourceId: string,
  ): Promise<void> {
    await this.access.requireWorkspaceAccess(userId, workspaceId, 'write')
    if (!(await this.repository.restore(workspaceId, type, resourceId))) {
      throw new NotFoundException('垃圾桶中的资源不存在')
    }
  }

  async permanentlyDelete(
    userId: string,
    workspaceId: string,
    type: TrashResourceType,
    resourceId: string,
  ): Promise<void> {
    await this.access.requireWorkspaceAccess(userId, workspaceId, 'write')
    try {
      if (!(await this.repository.permanentlyDelete(workspaceId, type, resourceId))) {
        throw new NotFoundException('垃圾桶中的资源不存在')
      }
    } catch (error) {
      if (postgresCode(error) === '23503') {
        throw new ConflictException('该公共模块仍被页面或其他模块引用，无法永久删除')
      }
      throw error
    }
  }

  private purgeExpired(): Promise<void> {
    return this.repository.purgeExpired(this.retentionDays)
  }
}
