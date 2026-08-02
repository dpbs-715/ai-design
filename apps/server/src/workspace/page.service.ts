import type {
  CreatePageRequest,
  PageDeletionResponse,
  PageMutationResponse,
  ProjectPageRecord,
  SavePageRequest,
} from '@ai-design/contracts/workspace'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { ProjectService } from './project.service.js'
import { ModuleReferenceRepository } from './module-reference.repository.js'
import { PageRepository } from './page.repository.js'
import { SchemaReferenceService } from './schema-reference.service.js'
import { WorkspaceAccessService } from './workspace-access.service.js'
import { rethrowAssetConstraint } from './workspace-errors.js'

@Injectable()
export class PageService {
  constructor(
    private readonly repository: PageRepository,
    private readonly moduleReferences: ModuleReferenceRepository,
    private readonly access: WorkspaceAccessService,
    private readonly projects: ProjectService,
    private readonly schemaReferences: SchemaReferenceService,
  ) {}

  async createPage(
    userId: string,
    projectId: string,
    input: CreatePageRequest,
  ): Promise<PageMutationResponse> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    try {
      const page = await this.repository.createPage(
        projectId,
        userId,
        input.schema,
        this.schemaReferences.collect(input.schema),
      )
      if (!page) throw new NotFoundException('项目不存在')
      return this.mutationResponse(userId, access.workspaceId, projectId, page)
    } catch (error) {
      rethrowAssetConstraint(error)
    }
  }

  async savePage(
    userId: string,
    projectId: string,
    pageId: string,
    input: SavePageRequest,
  ): Promise<PageMutationResponse> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    if (input.schema.id !== pageId) throw new BadRequestException('页面 Schema ID 与路径不一致')
    try {
      const page = await this.repository.savePage(
        projectId,
        pageId,
        input.schema,
        input.expectedRevision,
        this.schemaReferences.collect(input.schema),
      )
      if (page === 'conflict') throw new ConflictException('页面已被其他操作更新，请重新加载')
      if (!page) throw new NotFoundException('页面不存在')
      return this.mutationResponse(userId, access.workspaceId, projectId, page)
    } catch (error) {
      rethrowAssetConstraint(error)
    }
  }

  async duplicatePage(
    userId: string,
    projectId: string,
    pageId: string,
  ): Promise<PageMutationResponse> {
    await this.access.requireProjectAccess(userId, projectId, 'write')
    const source = await this.repository.getPage(projectId, pageId)
    if (!source) throw new NotFoundException('页面不存在')

    const id = randomUUID()
    const schema = structuredClone(source.schema)
    schema.id = id
    schema.root.name = `${schema.root.name} 副本`
    return this.createPage(userId, projectId, { schema })
  }

  async deletePage(
    userId: string,
    projectId: string,
    pageId: string,
  ): Promise<PageDeletionResponse> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    if (!(await this.repository.deletePage(projectId, pageId))) {
      throw new NotFoundException('页面不存在')
    }
    return {
      project: await this.projects.getRequiredProject(access.workspaceId, userId, projectId),
      moduleReferenceCounts: await this.moduleReferences.listPageReferenceCounts(projectId),
    }
  }

  private async mutationResponse(
    userId: string,
    workspaceId: string,
    projectId: string,
    page: ProjectPageRecord,
  ): Promise<PageMutationResponse> {
    return {
      project: await this.projects.getRequiredProject(workspaceId, userId, projectId),
      page,
      moduleReferenceCounts: await this.moduleReferences.listPageReferenceCounts(projectId),
    }
  }
}
