import {
  getNextPublicModuleVersion,
  isSamePublicModuleContent,
  MODULE_DRAFT_VERSION,
  normalizeProjectModuleInstanceProps,
} from '@ai-design/contracts/module'
import type { PageSchema } from '@ai-design/contracts/page'
import type {
  BusinessSystem,
  CreateBusinessSystemRequest,
  CreatePageRequest,
  CreateProjectRequest,
  CreatePublicModuleRequest,
  DesignProject,
  ProjectAssetsResponse,
  PageMutationResponse,
  PageDeletionResponse,
  ProjectPageRecord,
  PublicModuleMutationResponse,
  PublicModuleRecord,
  SavePageRequest,
  SavePublicModuleRequest,
  UpdateBusinessSystemRequest,
  UpdateProjectPreferenceRequest,
  UpdateProjectRequest,
  WorkspaceBootstrapResponse,
  WorkspaceRole,
  WorkspaceSummary,
} from '@ai-design/contracts/workspace'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import type { ModuleReferenceInput, WorkspaceAccess } from './workspace.repository.js'
import { WorkspaceRepository } from './workspace.repository.js'

const writableRoles = new Set<WorkspaceRole>(['owner', 'admin', 'editor'])
const administrativeRoles = new Set<WorkspaceRole>(['owner', 'admin'])
type AccessMode = 'read' | 'write' | 'admin'

@Injectable()
export class WorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  listWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    return this.repository.listWorkspaces(userId)
  }

  async getBootstrap(userId: string, workspaceId: string): Promise<WorkspaceBootstrapResponse> {
    const access = await this.requireWorkspaceAccess(userId, workspaceId)
    const workspace = await this.repository.getWorkspace(workspaceId)
    if (!workspace) throw new NotFoundException('工作区不存在')

    const [systems, projects] = await Promise.all([
      this.repository.listSystems(workspaceId),
      this.repository.listProjects(workspaceId, userId),
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
    await this.requireWorkspaceAccess(userId, workspaceId, 'write')
    try {
      return await this.repository.createSystem(workspaceId, input)
    } catch (error) {
      this.rethrowConstraint(error, '该工作区已经存在同名业务系统')
    }
  }

  async updateSystem(
    userId: string,
    workspaceId: string,
    systemId: string,
    input: UpdateBusinessSystemRequest,
  ): Promise<BusinessSystem> {
    await this.requireWorkspaceAccess(userId, workspaceId, 'write')
    try {
      const system = await this.repository.updateSystem(workspaceId, systemId, input)
      if (!system) throw new NotFoundException('业务系统不存在')
      return system
    } catch (error) {
      this.rethrowConstraint(error, '该工作区已经存在同名业务系统')
    }
  }

  async deleteSystem(userId: string, workspaceId: string, systemId: string): Promise<void> {
    await this.requireWorkspaceAccess(userId, workspaceId, 'admin')
    const result = await this.repository.deleteSystem(workspaceId, systemId)
    if (result === 'last-system') {
      throw new ConflictException('工作区至少需要保留一个业务系统')
    }
    if (result === 'not-found') throw new NotFoundException('业务系统不存在')
  }

  async createProject(
    userId: string,
    workspaceId: string,
    input: CreateProjectRequest,
  ): Promise<DesignProject> {
    await this.requireWorkspaceAccess(userId, workspaceId, 'write')
    const project = await this.repository.createProject(workspaceId, userId, input)
    if (!project) throw new BadRequestException('目标业务系统不存在')
    return project
  }

  async updateProject(
    userId: string,
    projectId: string,
    input: UpdateProjectRequest,
  ): Promise<DesignProject> {
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    if (!(await this.repository.updateProject(access.workspaceId, projectId, input))) {
      throw new NotFoundException('项目不存在')
    }
    return this.requireProject(access.workspaceId, userId, projectId)
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    if (!(await this.repository.deleteProject(access.workspaceId, projectId))) {
      throw new NotFoundException('项目不存在')
    }
  }

  async updateProjectPreference(
    userId: string,
    projectId: string,
    input: UpdateProjectPreferenceRequest,
  ): Promise<DesignProject> {
    const access = await this.requireProjectAccess(userId, projectId)
    try {
      await this.repository.updateProjectPreference(access.workspaceId, userId, projectId, input)
    } catch (error) {
      if (this.postgresCode(error) === '23503') {
        throw new BadRequestException('最近编辑页面不存在或不属于当前项目')
      }
      throw error
    }
    return this.requireProject(access.workspaceId, userId, projectId)
  }

  async getProjectAssets(userId: string, projectId: string): Promise<ProjectAssetsResponse> {
    await this.requireProjectAccess(userId, projectId)
    const [pages, modules] = await Promise.all([
      this.repository.listPages(projectId),
      this.repository.listModules(projectId),
    ])
    return { pages, modules }
  }

  async createPage(
    userId: string,
    projectId: string,
    input: CreatePageRequest,
  ): Promise<PageMutationResponse> {
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    try {
      const page = await this.repository.createPage(
        projectId,
        userId,
        input.schema,
        this.collectReferences(input.schema),
      )
      if (!page) throw new NotFoundException('项目不存在')
      return this.pageMutationResponse(userId, access.workspaceId, projectId, page)
    } catch (error) {
      this.rethrowAssetConstraint(error)
    }
  }

  async savePage(
    userId: string,
    projectId: string,
    pageId: string,
    input: SavePageRequest,
  ): Promise<PageMutationResponse> {
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    if (input.schema.id !== pageId) throw new BadRequestException('页面 Schema ID 与路径不一致')
    try {
      const page = await this.repository.savePage(
        projectId,
        pageId,
        input.schema,
        input.expectedRevision,
        this.collectReferences(input.schema),
      )
      if (page === 'conflict') throw new ConflictException('页面已被其他操作更新，请重新加载')
      if (!page) throw new NotFoundException('页面不存在')
      return this.pageMutationResponse(userId, access.workspaceId, projectId, page)
    } catch (error) {
      this.rethrowAssetConstraint(error)
    }
  }

  async duplicatePage(
    userId: string,
    projectId: string,
    pageId: string,
  ): Promise<PageMutationResponse> {
    await this.requireProjectAccess(userId, projectId, 'write')
    const source = (await this.repository.listPages(projectId)).find((page) => page.id === pageId)
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
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    if (!(await this.repository.deletePage(projectId, pageId))) {
      throw new NotFoundException('页面不存在')
    }
    return {
      project: await this.requireProject(access.workspaceId, userId, projectId),
      moduleReferenceCounts: await this.repository.listModuleReferenceCounts(projectId),
    }
  }

  async createModule(
    userId: string,
    projectId: string,
    input: CreatePublicModuleRequest,
  ): Promise<PublicModuleMutationResponse> {
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    if (input.schema.version !== MODULE_DRAFT_VERSION) {
      throw new BadRequestException('新建公共模块必须使用草稿版本')
    }
    try {
      const publicModule = await this.repository.createModule(
        projectId,
        input.schema,
        this.collectReferences(input.schema),
      )
      if (!publicModule) throw new NotFoundException('项目不存在')
      return this.publicModuleMutationResponse(userId, access.workspaceId, projectId, publicModule)
    } catch (error) {
      this.rethrowAssetConstraint(error)
    }
  }

  async saveModule(
    userId: string,
    projectId: string,
    moduleId: string,
    input: SavePublicModuleRequest,
  ): Promise<PublicModuleMutationResponse> {
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    if (input.schema.moduleId !== moduleId) {
      throw new BadRequestException('模块 Schema ID 与路径不一致')
    }
    if (input.schema.version !== MODULE_DRAFT_VERSION) {
      throw new BadRequestException('模块草稿必须使用 draft 版本')
    }
    try {
      const publicModule = await this.repository.saveModule(
        projectId,
        moduleId,
        input.schema,
        input.expectedRevision,
        this.collectReferences(input.schema),
      )
      if (publicModule === 'conflict') {
        throw new ConflictException('模块已被其他操作更新，请重新加载')
      }
      if (!publicModule) throw new NotFoundException('公共模块不存在')
      return this.publicModuleMutationResponse(userId, access.workspaceId, projectId, publicModule)
    } catch (error) {
      this.rethrowAssetConstraint(error)
    }
  }

  async publishModule(
    userId: string,
    projectId: string,
    moduleId: string,
    expectedRevision: number,
  ): Promise<PublicModuleMutationResponse> {
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    const publicModule = (await this.repository.listModules(projectId)).find(
      (candidate) => candidate.id === moduleId,
    )
    if (!publicModule) throw new NotFoundException('公共模块不存在')
    if (publicModule.revision !== expectedRevision) {
      throw new ConflictException('模块已被其他操作更新，请重新加载')
    }
    const latestVersion = publicModule.versions.at(-1)
    if (latestVersion && isSamePublicModuleContent(publicModule.schema, latestVersion.schema)) {
      return this.publicModuleMutationResponse(userId, access.workspaceId, projectId, publicModule)
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
        this.collectReferences(schema),
      )
      if (published === 'conflict') {
        throw new ConflictException('模块已被其他操作更新，请重新加载')
      }
      if (!published) throw new NotFoundException('公共模块不存在')
      return this.publicModuleMutationResponse(userId, access.workspaceId, projectId, published)
    } catch (error) {
      this.rethrowAssetConstraint(error)
    }
  }

  async duplicateModule(
    userId: string,
    projectId: string,
    moduleId: string,
  ): Promise<PublicModuleMutationResponse> {
    await this.requireProjectAccess(userId, projectId, 'write')
    const source = (await this.repository.listModules(projectId)).find(
      (candidate) => candidate.id === moduleId,
    )
    if (!source) throw new NotFoundException('公共模块不存在')

    const id = randomUUID()
    const schema = structuredClone(source.schema)
    schema.moduleId = id
    schema.root.name = `${schema.root.name} 副本`
    return this.createModule(userId, projectId, { schema })
  }

  async deleteModule(userId: string, projectId: string, moduleId: string): Promise<DesignProject> {
    const access = await this.requireProjectAccess(userId, projectId, 'write')
    const references = await this.repository.getModuleReferenceState(moduleId)
    if (references.referenceCount) {
      throw new ConflictException({
        statusCode: 409,
        message: '公共模块仍被页面或其他模块引用',
        pageIds: references.pageIds,
      })
    }
    try {
      if (!(await this.repository.deleteModule(projectId, moduleId))) {
        throw new NotFoundException('公共模块不存在')
      }
    } catch (error) {
      if (this.postgresCode(error) === '23503') {
        throw new ConflictException('公共模块仍被页面或其他模块引用')
      }
      throw error
    }
    return this.requireProject(access.workspaceId, userId, projectId)
  }

  private async requireWorkspaceAccess(
    userId: string,
    workspaceId: string,
    mode: AccessMode = 'read',
  ): Promise<WorkspaceAccess> {
    const access = await this.repository.findWorkspaceAccess(userId, workspaceId)
    if (!access) throw new NotFoundException('工作区不存在')
    if (mode === 'write' && !writableRoles.has(access.role)) {
      throw new ForbiddenException('没有编辑权限')
    }
    if (mode === 'admin' && !administrativeRoles.has(access.role)) {
      throw new ForbiddenException('没有管理权限')
    }
    return access
  }

  private async requireProjectAccess(
    userId: string,
    projectId: string,
    mode: Exclude<AccessMode, 'admin'> = 'read',
  ): Promise<WorkspaceAccess> {
    const access = await this.repository.findProjectAccess(userId, projectId)
    if (!access) throw new NotFoundException('项目不存在')
    if (mode === 'write' && !writableRoles.has(access.role)) {
      throw new ForbiddenException('没有编辑权限')
    }
    return access
  }

  private async requireProject(
    workspaceId: string,
    userId: string,
    projectId: string,
  ): Promise<DesignProject> {
    const project = (await this.repository.listProjects(workspaceId, userId)).find(
      (candidate) => candidate.id === projectId,
    )
    if (!project) throw new NotFoundException('项目不存在')
    return project
  }

  private async pageMutationResponse(
    userId: string,
    workspaceId: string,
    projectId: string,
    page: ProjectPageRecord,
  ): Promise<PageMutationResponse> {
    return {
      project: await this.requireProject(workspaceId, userId, projectId),
      page,
      moduleReferenceCounts: await this.repository.listModuleReferenceCounts(projectId),
    }
  }

  private async publicModuleMutationResponse(
    userId: string,
    workspaceId: string,
    projectId: string,
    publicModule: PublicModuleRecord,
  ): Promise<PublicModuleMutationResponse> {
    return {
      project: await this.requireProject(workspaceId, userId, projectId),
      publicModule,
    }
  }

  private collectReferences(schema: {
    root: { children: PageSchema['root']['children'] }
  }): ModuleReferenceInput[] {
    const references: ModuleReferenceInput[] = []
    const visit = (nodes: PageSchema['root']['children']) => {
      nodes.forEach((node) => {
        if (node.type === 'project-module-instance') {
          const { moduleId, version, updatePolicy } = normalizeProjectModuleInstanceProps(
            node.props,
          )
          const match = /^v([1-9]\d*)$/.exec(version)
          if (!z.uuid().safeParse(moduleId).success || !match) {
            throw new BadRequestException(`节点 ${node.id} 的公共模块引用不正确`)
          }
          references.push({
            nodeId: node.id,
            moduleId,
            versionNo: Number(match[1]),
            updatePolicy,
          })
        }
        visit(node.children)
      })
    }
    visit(schema.root.children)
    return references
  }

  private rethrowConstraint(error: unknown, message: string): never {
    if (this.postgresCode(error) === '23505') throw new ConflictException(message)
    throw error
  }

  private rethrowAssetConstraint(error: unknown): never {
    const code = this.postgresCode(error)
    if (code === '23503') {
      throw new BadRequestException('Schema 引用了不存在或不属于当前项目的公共模块版本')
    }
    if (code === '23505') throw new ConflictException('资源 ID 已存在')
    throw error
  }

  private postgresCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : undefined
  }
}
