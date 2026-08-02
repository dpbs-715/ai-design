import type {
  CreateProjectRequest,
  DesignProject,
  ProjectAssetsResponse,
  UpdateProjectPreferenceRequest,
  UpdateProjectRequest,
} from '@ai-design/contracts/workspace'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

import { PageRepository } from './page.repository.js'
import { ProjectRepository } from './project.repository.js'
import { PublicModuleRepository } from './public-module.repository.js'
import { WorkspaceAccessService } from './workspace-access.service.js'
import { postgresCode } from './workspace-errors.js'

@Injectable()
export class ProjectService {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly pages: PageRepository,
    private readonly modules: PublicModuleRepository,
    private readonly access: WorkspaceAccessService,
  ) {}

  async createProject(
    userId: string,
    workspaceId: string,
    input: CreateProjectRequest,
  ): Promise<DesignProject> {
    await this.access.requireWorkspaceAccess(userId, workspaceId, 'write')
    try {
      const project = await this.repository.createProject(workspaceId, userId, input)
      if (!project) throw new BadRequestException('目标业务系统不存在')
      return project
    } catch (error) {
      if (postgresCode(error) === '23503') {
        throw new BadRequestException('目标业务系统不存在')
      }
      throw error
    }
  }

  async updateProject(
    userId: string,
    projectId: string,
    input: UpdateProjectRequest,
  ): Promise<DesignProject> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    if (!(await this.repository.updateProject(access.workspaceId, projectId, input))) {
      throw new NotFoundException('项目不存在')
    }
    return this.getRequiredProject(access.workspaceId, userId, projectId)
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    if (!(await this.repository.deleteProject(access.workspaceId, projectId))) {
      throw new NotFoundException('项目不存在')
    }
  }

  async updateProjectPreference(
    userId: string,
    projectId: string,
    input: UpdateProjectPreferenceRequest,
  ): Promise<DesignProject> {
    const access = await this.access.requireProjectAccess(userId, projectId)
    try {
      const updated = await this.repository.updateProjectPreference(
        access.workspaceId,
        userId,
        projectId,
        input,
      )
      if (!updated) {
        throw new BadRequestException('最近编辑页面不存在或不属于当前项目')
      }
    } catch (error) {
      if (postgresCode(error) === '23503') {
        throw new BadRequestException('最近编辑页面不存在或不属于当前项目')
      }
      throw error
    }
    return this.getRequiredProject(access.workspaceId, userId, projectId)
  }

  async getProjectAssets(userId: string, projectId: string): Promise<ProjectAssetsResponse> {
    await this.access.requireProjectAccess(userId, projectId)
    const [pages, modules] = await Promise.all([
      this.pages.listPages(projectId),
      this.modules.listModules(projectId),
    ])
    return { pages, modules }
  }

  async getRequiredProject(
    workspaceId: string,
    userId: string,
    projectId: string,
  ): Promise<DesignProject> {
    const project = await this.repository.getProject(workspaceId, userId, projectId)
    if (!project) throw new NotFoundException('项目不存在')
    return project
  }
}
