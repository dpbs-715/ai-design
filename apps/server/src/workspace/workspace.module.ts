import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module.js'
import { DatabaseModule } from '../database/database.module.js'
import { PageService } from './page.service.js'
import { PageRepository } from './page.repository.js'
import { ProjectService } from './project.service.js'
import { ProjectRepository } from './project.repository.js'
import { ModuleReferenceRepository } from './module-reference.repository.js'
import { PublicModuleRepository } from './public-module.repository.js'
import { PublicModuleService } from './public-module.service.js'
import { SchemaReferenceService } from './schema-reference.service.js'
import { TrashRepository } from './trash.repository.js'
import { TrashService } from './trash.service.js'
import { WorkspaceAccessService } from './workspace-access.service.js'
import { WorkspaceController } from './workspace.controller.js'
import { WorkspaceRepository } from './workspace.repository.js'
import { WorkspaceService } from './workspace.service.js'

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceRepository,
    ProjectRepository,
    PageRepository,
    PublicModuleRepository,
    ModuleReferenceRepository,
    TrashRepository,
    WorkspaceAccessService,
    SchemaReferenceService,
    WorkspaceService,
    ProjectService,
    PageService,
    PublicModuleService,
    TrashService,
  ],
})
export class WorkspaceModule {}
