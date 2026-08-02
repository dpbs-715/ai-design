import type {
  BusinessSystem,
  CreateBusinessSystemRequest,
  UpdateBusinessSystemRequest,
  WorkspaceBootstrapResponse,
  WorkspaceSummary,
} from '@ai-design/contracts/workspace'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'

import { ProjectRepository } from './project.repository.js'
import { WorkspaceAccessService } from './workspace-access.service.js'
import { rethrowUniqueConstraint } from './workspace-errors.js'
import { WorkspaceRepository } from './workspace.repository.js'

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly projects: ProjectRepository,
    private readonly access: WorkspaceAccessService,
  ) {}

  listWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    return this.repository.listWorkspaces(userId)
  }

  async getBootstrap(userId: string, workspaceId: string): Promise<WorkspaceBootstrapResponse> {
    const access = await this.access.requireWorkspaceAccess(userId, workspaceId)
    const workspace = await this.repository.getWorkspace(workspaceId)
    if (!workspace) throw new NotFoundException('工作区不存在')

    const [systems, projects] = await Promise.all([
      this.repository.listSystems(workspaceId),
      this.projects.listProjects(workspaceId, userId),
    ])
    return {
      workspace: { ...workspace, role: access.role },
      systems,
      projects,
    }
  }

  async createSystem(
    userId: string,
    workspaceId: string,
    input: CreateBusinessSystemRequest,
  ): Promise<BusinessSystem> {
    await this.access.requireWorkspaceAccess(userId, workspaceId, 'write')
    try {
      return await this.repository.createSystem(workspaceId, input)
    } catch (error) {
      rethrowUniqueConstraint(error, '该工作区已经存在同名业务系统')
    }
  }

  async updateSystem(
    userId: string,
    workspaceId: string,
    systemId: string,
    input: UpdateBusinessSystemRequest,
  ): Promise<BusinessSystem> {
    await this.access.requireWorkspaceAccess(userId, workspaceId, 'write')
    try {
      const system = await this.repository.updateSystem(workspaceId, systemId, input)
      if (!system) throw new NotFoundException('业务系统不存在')
      return system
    } catch (error) {
      rethrowUniqueConstraint(error, '该工作区已经存在同名业务系统')
    }
  }

  async deleteSystem(userId: string, workspaceId: string, systemId: string): Promise<void> {
    await this.access.requireWorkspaceAccess(userId, workspaceId, 'admin')
    const result = await this.repository.deleteSystem(workspaceId, systemId)
    if (result === 'last-system') {
      throw new ConflictException('工作区至少需要保留一个业务系统')
    }
    if (result === 'not-empty') {
      throw new ConflictException('业务系统中仍有项目，请先处理这些项目')
    }
    if (result === 'not-found') throw new NotFoundException('业务系统不存在')
  }
}
