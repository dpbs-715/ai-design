import {
  createBusinessSystemRequestSchema,
  createPageRequestSchema,
  createProjectRequestSchema,
  createPublicModuleRequestSchema,
  publishPublicModuleRequestSchema,
  savePageRequestSchema,
  savePublicModuleRequestSchema,
  trashResourceTypeSchema,
  updateBusinessSystemRequestSchema,
  updateProjectPreferenceRequestSchema,
  updateProjectRequestSchema,
} from '@ai-design/contracts/workspace'
import type {
  BusinessSystem,
  CreateBusinessSystemRequest,
  CreatePageRequest,
  CreateProjectRequest,
  CreatePublicModuleRequest,
  DesignProject,
  PageMutationResponse,
  PageDeletionResponse,
  ProjectAssetsResponse,
  PublicModuleMutationResponse,
  PublicModuleVersionList,
  PublishPublicModuleRequest,
  SavePageRequest,
  SavePublicModuleRequest,
  UpdateBusinessSystemRequest,
  UpdateProjectPreferenceRequest,
  UpdateProjectRequest,
  TrashResourceType,
  TrashResponse,
  WorkspaceBootstrapResponse,
  WorkspaceSummary,
} from '@ai-design/contracts/workspace'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'

import type { AuthenticatedRequest } from '../auth/authenticated-request.js'
import { SessionAuthGuard } from '../auth/session-auth.guard.js'
import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import { PageService } from './page.service.js'
import { ProjectService } from './project.service.js'
import { PublicModuleService } from './public-module.service.js'
import { TrashService } from './trash.service.js'
import { WorkspaceService } from './workspace.service.js'

@Controller()
@UseGuards(SessionAuthGuard)
export class WorkspaceController {
  constructor(
    private readonly workspaces: WorkspaceService,
    private readonly projects: ProjectService,
    private readonly pages: PageService,
    private readonly modules: PublicModuleService,
    private readonly trash: TrashService,
  ) {}

  @Get('workspaces')
  listWorkspaces(@Req() request: AuthenticatedRequest): Promise<WorkspaceSummary[]> {
    return this.workspaces.listWorkspaces(request.auth.userId)
  }

  @Get('workspaces/:workspaceId/bootstrap')
  getBootstrap(
    @Req() request: AuthenticatedRequest,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
  ): Promise<WorkspaceBootstrapResponse> {
    return this.workspaces.getBootstrap(request.auth.userId, workspaceId)
  }

  @Post('workspaces/:workspaceId/systems')
  createSystem(
    @Req() request: AuthenticatedRequest,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body(new ZodValidationPipe(createBusinessSystemRequestSchema))
    input: CreateBusinessSystemRequest,
  ): Promise<BusinessSystem> {
    return this.workspaces.createSystem(request.auth.userId, workspaceId, input)
  }

  @Patch('workspaces/:workspaceId/systems/:systemId')
  updateSystem(
    @Req() request: AuthenticatedRequest,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('systemId', ParseUUIDPipe) systemId: string,
    @Body(new ZodValidationPipe(updateBusinessSystemRequestSchema))
    input: UpdateBusinessSystemRequest,
  ): Promise<BusinessSystem> {
    return this.workspaces.updateSystem(request.auth.userId, workspaceId, systemId, input)
  }

  @Delete('workspaces/:workspaceId/systems/:systemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSystem(
    @Req() request: AuthenticatedRequest,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('systemId', ParseUUIDPipe) systemId: string,
  ): Promise<void> {
    return this.workspaces.deleteSystem(request.auth.userId, workspaceId, systemId)
  }

  @Post('workspaces/:workspaceId/projects')
  createProject(
    @Req() request: AuthenticatedRequest,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body(new ZodValidationPipe(createProjectRequestSchema)) input: CreateProjectRequest,
  ): Promise<DesignProject> {
    return this.projects.createProject(request.auth.userId, workspaceId, input)
  }

  @Patch('projects/:projectId')
  updateProject(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ZodValidationPipe(updateProjectRequestSchema)) input: UpdateProjectRequest,
  ): Promise<DesignProject> {
    return this.projects.updateProject(request.auth.userId, projectId, input)
  }

  @Delete('projects/:projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProject(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<void> {
    return this.projects.deleteProject(request.auth.userId, projectId)
  }

  @Put('projects/:projectId/preference')
  updateProjectPreference(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ZodValidationPipe(updateProjectPreferenceRequestSchema))
    input: UpdateProjectPreferenceRequest,
  ): Promise<DesignProject> {
    return this.projects.updateProjectPreference(request.auth.userId, projectId, input)
  }

  @Get('projects/:projectId/assets')
  getProjectAssets(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectAssetsResponse> {
    return this.projects.getProjectAssets(request.auth.userId, projectId)
  }

  @Get('projects/:projectId/module-versions')
  listModuleVersions(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<PublicModuleVersionList[]> {
    return this.modules.listModuleVersions(request.auth.userId, projectId)
  }

  @Get('workspaces/:workspaceId/trash')
  listTrash(
    @Req() request: AuthenticatedRequest,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
  ): Promise<TrashResponse> {
    return this.trash.listItems(request.auth.userId, workspaceId)
  }

  @Post('workspaces/:workspaceId/trash/:resourceType/:resourceId/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreTrashItem(
    @Req() request: AuthenticatedRequest,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('resourceType', new ZodValidationPipe(trashResourceTypeSchema))
    resourceType: TrashResourceType,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ): Promise<void> {
    return this.trash.restore(request.auth.userId, workspaceId, resourceType, resourceId)
  }

  @Delete('workspaces/:workspaceId/trash/:resourceType/:resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  permanentlyDeleteTrashItem(
    @Req() request: AuthenticatedRequest,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('resourceType', new ZodValidationPipe(trashResourceTypeSchema))
    resourceType: TrashResourceType,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ): Promise<void> {
    return this.trash.permanentlyDelete(request.auth.userId, workspaceId, resourceType, resourceId)
  }

  @Post('projects/:projectId/pages')
  createPage(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ZodValidationPipe(createPageRequestSchema)) input: CreatePageRequest,
  ): Promise<PageMutationResponse> {
    return this.pages.createPage(request.auth.userId, projectId, input)
  }

  @Put('projects/:projectId/pages/:pageId')
  savePage(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Body(new ZodValidationPipe(savePageRequestSchema)) input: SavePageRequest,
  ): Promise<PageMutationResponse> {
    return this.pages.savePage(request.auth.userId, projectId, pageId, input)
  }

  @Post('projects/:projectId/pages/:pageId/duplicate')
  duplicatePage(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId', ParseUUIDPipe) pageId: string,
  ): Promise<PageMutationResponse> {
    return this.pages.duplicatePage(request.auth.userId, projectId, pageId)
  }

  @Delete('projects/:projectId/pages/:pageId')
  deletePage(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId', ParseUUIDPipe) pageId: string,
  ): Promise<PageDeletionResponse> {
    return this.pages.deletePage(request.auth.userId, projectId, pageId)
  }

  @Post('projects/:projectId/modules')
  createModule(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ZodValidationPipe(createPublicModuleRequestSchema))
    input: CreatePublicModuleRequest,
  ): Promise<PublicModuleMutationResponse> {
    return this.modules.createModule(request.auth.userId, projectId, input)
  }

  @Put('projects/:projectId/modules/:moduleId')
  saveModule(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body(new ZodValidationPipe(savePublicModuleRequestSchema))
    input: SavePublicModuleRequest,
  ): Promise<PublicModuleMutationResponse> {
    return this.modules.saveModule(request.auth.userId, projectId, moduleId, input)
  }

  @Post('projects/:projectId/modules/:moduleId/publish')
  publishModule(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body(new ZodValidationPipe(publishPublicModuleRequestSchema))
    input: PublishPublicModuleRequest,
  ): Promise<PublicModuleMutationResponse> {
    return this.modules.publishModule(
      request.auth.userId,
      projectId,
      moduleId,
      input.expectedRevision,
    )
  }

  @Post('projects/:projectId/modules/:moduleId/duplicate')
  duplicateModule(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ): Promise<PublicModuleMutationResponse> {
    return this.modules.duplicateModule(request.auth.userId, projectId, moduleId)
  }

  @Delete('projects/:projectId/modules/:moduleId')
  deleteModule(
    @Req() request: AuthenticatedRequest,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ): Promise<DesignProject> {
    return this.modules.deleteModule(request.auth.userId, projectId, moduleId)
  }
}
