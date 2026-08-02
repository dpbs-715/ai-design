import type { WorkspaceRole } from '@ai-design/contracts/workspace'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

import { ProjectRepository } from './project.repository.js'
import type { WorkspaceAccess } from './workspace-access.types.js'
import { WorkspaceRepository } from './workspace.repository.js'

const writableRoles = new Set<WorkspaceRole>(['owner', 'admin', 'editor'])
const administrativeRoles = new Set<WorkspaceRole>(['owner', 'admin'])
type AccessMode = 'read' | 'write' | 'admin'

@Injectable()
export class WorkspaceAccessService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async requireWorkspaceAccess(
    userId: string,
    workspaceId: string,
    mode: AccessMode = 'read',
  ): Promise<WorkspaceAccess> {
    const access = await this.workspaces.findWorkspaceAccess(userId, workspaceId)
    if (!access) throw new NotFoundException('工作区不存在')
    this.requireRole(access.role, mode)
    return access
  }

  async requireProjectAccess(
    userId: string,
    projectId: string,
    mode: Exclude<AccessMode, 'admin'> = 'read',
  ): Promise<WorkspaceAccess> {
    const access = await this.projects.findProjectAccess(userId, projectId)
    if (!access) throw new NotFoundException('项目不存在')
    this.requireRole(access.role, mode)
    return access
  }

  private requireRole(role: WorkspaceRole, mode: AccessMode): void {
    if (mode === 'write' && !writableRoles.has(role)) {
      throw new ForbiddenException('没有编辑权限')
    }
    if (mode === 'admin' && !administrativeRoles.has(role)) {
      throw new ForbiddenException('没有管理权限')
    }
  }
}
