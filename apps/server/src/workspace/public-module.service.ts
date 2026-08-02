import {
  getNextPublicModuleVersion,
  isSamePublicModuleContent,
  MODULE_DRAFT_VERSION,
} from '@ai-design/contracts/module'
import type {
  CreatePublicModuleRequest,
  DesignProject,
  PublicModuleMutationResponse,
  PublicModuleRecord,
  PublicModuleVersionList,
  SavePublicModuleRequest,
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
import { PublicModuleRepository } from './public-module.repository.js'
import { SchemaReferenceService } from './schema-reference.service.js'
import { WorkspaceAccessService } from './workspace-access.service.js'
import { postgresCode, rethrowAssetConstraint } from './workspace-errors.js'

@Injectable()
export class PublicModuleService {
  constructor(
    private readonly repository: PublicModuleRepository,
    private readonly moduleReferences: ModuleReferenceRepository,
    private readonly access: WorkspaceAccessService,
    private readonly projects: ProjectService,
    private readonly schemaReferences: SchemaReferenceService,
  ) {}

  async listModuleVersions(userId: string, projectId: string): Promise<PublicModuleVersionList[]> {
    await this.access.requireProjectAccess(userId, projectId)
    return this.repository.listModuleVersions(projectId)
  }

  async createModule(
    userId: string,
    projectId: string,
    input: CreatePublicModuleRequest,
  ): Promise<PublicModuleMutationResponse> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    if (input.schema.version !== MODULE_DRAFT_VERSION) {
      throw new BadRequestException('新建公共模块必须使用草稿版本')
    }
    try {
      const references = this.schemaReferences.collect(input.schema)
      this.schemaReferences.rejectSelfReference(input.schema.moduleId, references)
      const publicModule = await this.repository.createModule(projectId, input.schema, references)
      if (!publicModule) throw new NotFoundException('项目不存在')
      return this.mutationResponse(userId, access.workspaceId, projectId, publicModule)
    } catch (error) {
      rethrowAssetConstraint(error)
    }
  }

  async saveModule(
    userId: string,
    projectId: string,
    moduleId: string,
    input: SavePublicModuleRequest,
  ): Promise<PublicModuleMutationResponse> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    if (input.schema.moduleId !== moduleId) {
      throw new BadRequestException('模块 Schema ID 与路径不一致')
    }
    if (input.schema.version !== MODULE_DRAFT_VERSION) {
      throw new BadRequestException('模块草稿必须使用 draft 版本')
    }
    try {
      const references = this.schemaReferences.collect(input.schema)
      this.schemaReferences.rejectSelfReference(moduleId, references)
      const publicModule = await this.repository.saveModule(
        projectId,
        moduleId,
        input.schema,
        input.expectedRevision,
        references,
      )
      if (publicModule === 'conflict') {
        throw new ConflictException('模块已被其他操作更新，请重新加载')
      }
      if (!publicModule) throw new NotFoundException('公共模块不存在')
      return this.mutationResponse(userId, access.workspaceId, projectId, publicModule)
    } catch (error) {
      rethrowAssetConstraint(error)
    }
  }

  async publishModule(
    userId: string,
    projectId: string,
    moduleId: string,
    expectedRevision: number,
  ): Promise<PublicModuleMutationResponse> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    const publicModule = await this.repository.getModule(projectId, moduleId)
    if (!publicModule) throw new NotFoundException('公共模块不存在')
    if (publicModule.revision !== expectedRevision) {
      throw new ConflictException('模块已被其他操作更新，请重新加载')
    }
    const latestVersion = publicModule.versions.at(-1)
    if (latestVersion && isSamePublicModuleContent(publicModule.schema, latestVersion.schema)) {
      return this.mutationResponse(userId, access.workspaceId, projectId, publicModule)
    }

    const version = getNextPublicModuleVersion(publicModule.versions)
    const versionNo = Number(version.slice(1))
    const schema = { ...structuredClone(publicModule.schema), version }
    try {
      const published = await this.repository.publishModule(
        projectId,
        moduleId,
        expectedRevision,
        versionNo,
        schema,
        this.schemaReferences.collect(schema),
      )
      if (published === 'conflict') {
        throw new ConflictException('模块已被其他操作更新，请重新加载')
      }
      if (!published) throw new NotFoundException('公共模块不存在')
      return this.mutationResponse(userId, access.workspaceId, projectId, published)
    } catch (error) {
      rethrowAssetConstraint(error)
    }
  }

  async duplicateModule(
    userId: string,
    projectId: string,
    moduleId: string,
  ): Promise<PublicModuleMutationResponse> {
    await this.access.requireProjectAccess(userId, projectId, 'write')
    const source = await this.repository.getModule(projectId, moduleId)
    if (!source) throw new NotFoundException('公共模块不存在')

    const id = randomUUID()
    const schema = structuredClone(source.schema)
    schema.moduleId = id
    schema.root.name = `${schema.root.name} 副本`
    return this.createModule(userId, projectId, { schema })
  }

  async deleteModule(userId: string, projectId: string, moduleId: string): Promise<DesignProject> {
    const access = await this.access.requireProjectAccess(userId, projectId, 'write')
    try {
      const result = await this.repository.deleteModule(projectId, moduleId)
      if (result === 'referenced') {
        const references = await this.moduleReferences.getModuleReferenceState(projectId, moduleId)
        throw new ConflictException({
          statusCode: 409,
          message: '公共模块仍被页面或其他模块引用',
          blockers: references,
        })
      }
      if (result === 'missing') {
        throw new NotFoundException('公共模块不存在')
      }
    } catch (error) {
      if (postgresCode(error) === '23503') {
        throw new ConflictException('公共模块仍被页面或其他模块引用')
      }
      throw error
    }
    return this.projects.getRequiredProject(access.workspaceId, userId, projectId)
  }

  private async mutationResponse(
    userId: string,
    workspaceId: string,
    projectId: string,
    publicModule: PublicModuleRecord,
  ): Promise<PublicModuleMutationResponse> {
    return {
      project: await this.projects.getRequiredProject(workspaceId, userId, projectId),
      publicModule,
    }
  }
}
