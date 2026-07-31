import type {
  BusinessSystem,
  DesignProject,
  ProjectPageRecord,
  PublicModuleRecord,
  StoredPublicModuleVersion,
  WorkspaceRole,
  WorkspaceSummary,
} from '@ai-design/contracts/workspace'
import { Injectable } from '@nestjs/common'
import type { PoolClient } from 'pg'

import { DatabaseService } from '../database/database.service.js'

interface WorkspaceRow {
  id: string
  name: string
  role: WorkspaceRole
}

interface SystemRow {
  id: string
  workspace_id: string
  name: string
  description: string
  icon: string
  sort_order: number
  created_at: Date
  updated_at: Date
}

interface ProjectRow {
  id: string
  workspace_id: string
  system_id: string
  name: string
  description: string
  created_at: Date
  updated_at: Date
  last_opened_at: Date | null
  last_edited_page_id: string | null
  is_favorite: boolean
  page_count: number
  module_count: number
}

interface PageRow {
  id: string
  project_id: string
  draft_schema: unknown
  revision: string
  published_version_id: string | null
  module_reference_count: number
  created_at: Date
  updated_at: Date
}

interface ModuleRow {
  id: string
  project_id: string
  draft_schema: unknown
  revision: string
  published_version_id: string | null
  reference_count: number
  created_at: Date
  updated_at: Date
}

interface ModuleVersionJson {
  id: string
  version_no: number
  schema: unknown
  published_at: string
}

interface ModuleWithVersionsRow extends ModuleRow {
  versions: ModuleVersionJson[]
}

export interface WorkspaceAccess {
  workspaceId: string
  role: WorkspaceRole
}

interface WorkspaceDetails {
  id: string
  name: string
}

export type DeleteSystemResult = 'deleted' | 'last-system' | 'not-found'

export interface ModuleReferenceInput {
  nodeId: string
  moduleId: string
  versionNo: number
  updatePolicy: 'manual' | 'latest'
}

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly database: DatabaseService) {}

  async listWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    const result = await this.database.query<WorkspaceRow>(
      `
        SELECT workspaces.id, workspaces.name, members.role
        FROM workspace_members AS members
        INNER JOIN workspaces ON workspaces.id = members.workspace_id
        WHERE members.user_id = $1
        ORDER BY members.joined_at, workspaces.id
      `,
      [userId],
    )

    return result.rows.map((row) => ({ id: row.id, name: row.name, role: row.role }))
  }

  async findWorkspaceAccess(userId: string, workspaceId: string): Promise<WorkspaceAccess | null> {
    const result = await this.database.query<{ workspace_id: string; role: WorkspaceRole }>(
      `
        SELECT workspace_id, role
        FROM workspace_members
        WHERE user_id = $1 AND workspace_id = $2
      `,
      [userId, workspaceId],
    )
    const row = result.rows[0]
    return row ? { workspaceId: row.workspace_id, role: row.role } : null
  }

  async findProjectAccess(userId: string, projectId: string): Promise<WorkspaceAccess | null> {
    const result = await this.database.query<{ workspace_id: string; role: WorkspaceRole }>(
      `
        SELECT projects.workspace_id, members.role
        FROM projects
        INNER JOIN workspace_members AS members
          ON members.workspace_id = projects.workspace_id
        WHERE projects.id = $1 AND members.user_id = $2
      `,
      [projectId, userId],
    )
    const row = result.rows[0]
    return row ? { workspaceId: row.workspace_id, role: row.role } : null
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceDetails | null> {
    const result = await this.database.query<{ id: string; name: string }>(
      'SELECT id, name FROM workspaces WHERE id = $1',
      [workspaceId],
    )
    const row = result.rows[0]
    return row ?? null
  }

  async listSystems(workspaceId: string): Promise<BusinessSystem[]> {
    const result = await this.database.query<SystemRow>(
      `
        SELECT id, workspace_id, name, description, icon, sort_order, created_at, updated_at
        FROM business_systems
        WHERE workspace_id = $1
        ORDER BY sort_order, created_at, id
      `,
      [workspaceId],
    )
    return result.rows.map((row) => this.toSystem(row))
  }

  async listProjects(workspaceId: string, userId: string): Promise<DesignProject[]> {
    const result = await this.database.query<ProjectRow>(
      `
        SELECT
          projects.id,
          projects.workspace_id,
          projects.system_id,
          projects.name,
          projects.description,
          projects.created_at,
          projects.updated_at,
          preferences.last_opened_at,
          preferences.last_edited_page_id,
          COALESCE(preferences.is_favorite, false) AS is_favorite,
          (
            SELECT count(*)::integer
            FROM pages
            WHERE pages.project_id = projects.id
          ) AS page_count,
          (
            SELECT count(*)::integer
            FROM public_modules
            WHERE public_modules.project_id = projects.id
          ) AS module_count
        FROM projects
        LEFT JOIN user_project_preferences AS preferences
          ON preferences.workspace_id = projects.workspace_id
          AND preferences.project_id = projects.id
          AND preferences.user_id = $2
        WHERE projects.workspace_id = $1
        ORDER BY projects.updated_at DESC, projects.id
      `,
      [workspaceId, userId],
    )
    return result.rows.map((row) => this.toProject(row))
  }

  async createSystem(
    workspaceId: string,
    input: { name: string; description: string; icon: string },
  ): Promise<BusinessSystem> {
    const result = await this.database.query<SystemRow>(
      `
        INSERT INTO business_systems (workspace_id, name, description, icon, sort_order)
        VALUES (
          $1,
          $2,
          $3,
          $4,
          COALESCE(
            (SELECT max(sort_order) + 1 FROM business_systems WHERE workspace_id = $1),
            0
          )
        )
        RETURNING id, workspace_id, name, description, icon, sort_order, created_at, updated_at
      `,
      [workspaceId, input.name, input.description, input.icon],
    )
    return this.toSystem(result.rows[0]!)
  }

  async updateSystem(
    workspaceId: string,
    systemId: string,
    input: { name?: string; description?: string; icon?: string },
  ): Promise<BusinessSystem | null> {
    const result = await this.database.query<SystemRow>(
      `
        UPDATE business_systems
        SET
          name = COALESCE($3, name),
          description = COALESCE($4, description),
          icon = COALESCE($5, icon),
          updated_at = now()
        WHERE workspace_id = $1 AND id = $2
        RETURNING id, workspace_id, name, description, icon, sort_order, created_at, updated_at
      `,
      [workspaceId, systemId, input.name ?? null, input.description ?? null, input.icon ?? null],
    )
    const row = result.rows[0]
    return row ? this.toSystem(row) : null
  }

  async deleteSystem(workspaceId: string, systemId: string): Promise<DeleteSystemResult> {
    return this.database.withTransaction(async (client) => {
      await client.query('SELECT id FROM workspaces WHERE id = $1 FOR UPDATE', [workspaceId])
      const state = await client.query<{ exists: boolean; count: number }>(
        `
          SELECT
            EXISTS (
              SELECT 1
              FROM business_systems
              WHERE workspace_id = $1 AND id = $2
            ) AS exists,
            count(*)::integer AS count
          FROM business_systems
          WHERE workspace_id = $1
        `,
        [workspaceId, systemId],
      )
      const current = state.rows[0]
      if (!current?.exists) return 'not-found'
      if (current.count <= 1) return 'last-system'

      await client.query('DELETE FROM business_systems WHERE workspace_id = $1 AND id = $2', [
        workspaceId,
        systemId,
      ])
      return 'deleted'
    })
  }

  async createProject(
    workspaceId: string,
    userId: string,
    input: { systemId: string; name: string; description: string },
  ): Promise<DesignProject | null> {
    const result = await this.database.query<ProjectRow>(
      `
        WITH inserted AS (
          INSERT INTO projects (workspace_id, system_id, name, description)
          SELECT $1, systems.id, $3, $4
          FROM business_systems AS systems
          WHERE systems.workspace_id = $1 AND systems.id = $2
          RETURNING *
        ),
        preference AS (
          INSERT INTO user_project_preferences (workspace_id, user_id, project_id)
          SELECT workspace_id, $5, id
          FROM inserted
          ON CONFLICT DO NOTHING
        )
        SELECT
          inserted.id,
          inserted.workspace_id,
          inserted.system_id,
          inserted.name,
          inserted.description,
          inserted.created_at,
          inserted.updated_at,
          NULL::timestamptz AS last_opened_at,
          NULL::uuid AS last_edited_page_id,
          false AS is_favorite,
          0::integer AS page_count,
          0::integer AS module_count
        FROM inserted
      `,
      [workspaceId, input.systemId, input.name, input.description, userId],
    )
    const row = result.rows[0]
    return row ? this.toProject(row) : null
  }

  async updateProject(
    workspaceId: string,
    projectId: string,
    input: { name?: string; description?: string },
  ): Promise<boolean> {
    const result = await this.database.query(
      `
        UPDATE projects
        SET
          name = COALESCE($3, name),
          description = COALESCE($4, description),
          updated_at = now()
        WHERE workspace_id = $1 AND id = $2
      `,
      [workspaceId, projectId, input.name ?? null, input.description ?? null],
    )
    return (result.rowCount ?? 0) > 0
  }

  async deleteProject(workspaceId: string, projectId: string): Promise<boolean> {
    const result = await this.database.query(
      'DELETE FROM projects WHERE workspace_id = $1 AND id = $2',
      [workspaceId, projectId],
    )
    return (result.rowCount ?? 0) > 0
  }

  async updateProjectPreference(
    workspaceId: string,
    userId: string,
    projectId: string,
    input: {
      isFavorite?: boolean
      recordVisit?: true
      lastEditedPageId?: string | null
    },
  ): Promise<void> {
    await this.database.query(
      `
        INSERT INTO user_project_preferences (
          workspace_id,
          user_id,
          project_id,
          is_favorite,
          last_opened_at,
          last_edited_page_id
        )
        VALUES (
          $1,
          $2,
          $3,
          COALESCE($4, false),
          CASE WHEN $5::boolean THEN now() ELSE NULL END,
          $6
        )
        ON CONFLICT (workspace_id, user_id, project_id)
        DO UPDATE SET
          is_favorite = COALESCE($4, user_project_preferences.is_favorite),
          last_opened_at = CASE
            WHEN $5::boolean THEN now()
            ELSE user_project_preferences.last_opened_at
          END,
          last_edited_page_id = CASE
            WHEN $7::boolean THEN $6
            ELSE user_project_preferences.last_edited_page_id
          END,
          updated_at = now()
      `,
      [
        workspaceId,
        userId,
        projectId,
        input.isFavorite ?? null,
        input.recordVisit === true,
        input.lastEditedPageId ?? null,
        Object.hasOwn(input, 'lastEditedPageId'),
      ],
    )
  }

  async listPages(projectId: string): Promise<ProjectPageRecord[]> {
    const result = await this.database.query<PageRow>(
      `
        SELECT
          pages.id,
          pages.project_id,
          pages.draft_schema,
          pages.revision,
          pages.published_version_id,
          pages.created_at,
          pages.updated_at,
          (
            SELECT count(DISTINCT referenced_module_id)::integer
            FROM module_references
            WHERE owner_page_id = pages.id
          ) AS module_reference_count
        FROM pages
        WHERE pages.project_id = $1
        ORDER BY pages.updated_at DESC, pages.id
      `,
      [projectId],
    )
    return result.rows.map((row) => this.toPage(row))
  }

  async listModules(projectId: string): Promise<PublicModuleRecord[]> {
    const result = await this.database.query<ModuleWithVersionsRow>(
      `
        SELECT
          modules.id,
          modules.project_id,
          modules.draft_schema,
          modules.revision,
          modules.published_version_id,
          modules.created_at,
          modules.updated_at,
          (
            SELECT count(DISTINCT owner_page_id)::integer
            FROM module_references
            WHERE referenced_module_id = modules.id AND owner_page_id IS NOT NULL
          ) AS reference_count,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', versions.id,
                'version_no', versions.version_no,
                'schema', versions.schema,
                'published_at', versions.published_at
              )
              ORDER BY versions.version_no
            ) FILTER (WHERE versions.id IS NOT NULL),
            '[]'::jsonb
          ) AS versions
        FROM public_modules AS modules
        LEFT JOIN public_module_versions AS versions ON versions.module_id = modules.id
        WHERE modules.project_id = $1
        GROUP BY modules.id
        ORDER BY modules.updated_at DESC, modules.id
      `,
      [projectId],
    )
    return result.rows.map((row) =>
      this.toModule(
        row,
        row.versions.map((version) => ({
          id: version.id,
          version: `v${version.version_no}`,
          schema: version.schema as StoredPublicModuleVersion['schema'],
          publishedAt: new Date(version.published_at).toISOString(),
        })),
      ),
    )
  }

  async listModuleReferenceCounts(
    projectId: string,
  ): Promise<Array<{ moduleId: string; referenceCount: number }>> {
    const result = await this.database.query<{ module_id: string; reference_count: number }>(
      `
        SELECT
          modules.id AS module_id,
          count(DISTINCT refs.owner_page_id)::integer AS reference_count
        FROM public_modules AS modules
        LEFT JOIN module_references AS refs
          ON refs.referenced_module_id = modules.id
          AND refs.owner_page_id IS NOT NULL
        WHERE modules.project_id = $1
        GROUP BY modules.id
        ORDER BY modules.id
      `,
      [projectId],
    )
    return result.rows.map((row) => ({
      moduleId: row.module_id,
      referenceCount: row.reference_count,
    }))
  }

  async createPage(
    projectId: string,
    userId: string,
    schema: ProjectPageRecord['schema'],
    references: ModuleReferenceInput[],
  ): Promise<ProjectPageRecord | null> {
    await this.database.withTransaction(async (client) => {
      const insert = await client.query(
        `
          INSERT INTO pages (id, project_id, draft_schema)
          SELECT $1, projects.id, $3::jsonb
          FROM projects
          WHERE projects.id = $2
        `,
        [schema.id, projectId, JSON.stringify(schema)],
      )
      if ((insert.rowCount ?? 0) === 0) return
      await this.replaceReferences(client, 'owner_page_id', schema.id, projectId, references)
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
      await client.query(
        `
          INSERT INTO user_project_preferences (
            workspace_id,
            user_id,
            project_id,
            last_edited_page_id,
            last_opened_at,
            updated_at
          )
          SELECT projects.workspace_id, $2, $1, $3, now(), now()
          FROM projects
          WHERE projects.id = $1
          ON CONFLICT (workspace_id, user_id, project_id) DO UPDATE
          SET last_edited_page_id = $3, last_opened_at = now(), updated_at = now()
        `,
        [projectId, userId, schema.id],
      )
    })
    return this.findPage(projectId, schema.id)
  }

  async savePage(
    projectId: string,
    pageId: string,
    schema: ProjectPageRecord['schema'],
    expectedRevision: number,
    references: ModuleReferenceInput[],
  ): Promise<ProjectPageRecord | 'conflict' | null> {
    const status = await this.database.withTransaction(async (client) => {
      const update = await client.query(
        `
          UPDATE pages
          SET draft_schema = $4::jsonb, revision = revision + 1, updated_at = now()
          WHERE project_id = $1 AND id = $2 AND revision = $3
        `,
        [projectId, pageId, expectedRevision, JSON.stringify(schema)],
      )
      if ((update.rowCount ?? 0) === 0) {
        const exists = await client.query('SELECT 1 FROM pages WHERE project_id = $1 AND id = $2', [
          projectId,
          pageId,
        ])
        return exists.rowCount ? 'conflict' : 'missing'
      }
      await this.replaceReferences(client, 'owner_page_id', pageId, projectId, references)
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
      return 'saved'
    })
    if (status === 'conflict') return 'conflict'
    if (status === 'missing') return null
    return this.findPage(projectId, pageId)
  }

  async deletePage(projectId: string, pageId: string): Promise<boolean> {
    const result = await this.database.query(
      `
        WITH deleted AS (
          DELETE FROM pages
          WHERE project_id = $1 AND id = $2
          RETURNING project_id
        )
        UPDATE projects
        SET updated_at = now()
        WHERE id = $1 AND EXISTS (SELECT 1 FROM deleted)
      `,
      [projectId, pageId],
    )
    return (result.rowCount ?? 0) > 0
  }

  async createModule(
    projectId: string,
    schema: PublicModuleRecord['schema'],
    references: ModuleReferenceInput[],
  ): Promise<PublicModuleRecord | null> {
    await this.database.withTransaction(async (client) => {
      const insert = await client.query(
        `
          INSERT INTO public_modules (id, project_id, draft_schema)
          SELECT $1, projects.id, $3::jsonb
          FROM projects
          WHERE projects.id = $2
        `,
        [schema.moduleId, projectId, JSON.stringify(schema)],
      )
      if ((insert.rowCount ?? 0) === 0) return
      await this.replaceReferences(
        client,
        'owner_module_id',
        schema.moduleId,
        projectId,
        references,
      )
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
    })
    return this.findModule(projectId, schema.moduleId)
  }

  async saveModule(
    projectId: string,
    moduleId: string,
    schema: PublicModuleRecord['schema'],
    expectedRevision: number,
    references: ModuleReferenceInput[],
  ): Promise<PublicModuleRecord | 'conflict' | null> {
    const status = await this.database.withTransaction(async (client) => {
      const update = await client.query(
        `
          UPDATE public_modules
          SET draft_schema = $4::jsonb, revision = revision + 1, updated_at = now()
          WHERE project_id = $1 AND id = $2 AND revision = $3
        `,
        [projectId, moduleId, expectedRevision, JSON.stringify(schema)],
      )
      if ((update.rowCount ?? 0) === 0) {
        const exists = await client.query(
          'SELECT 1 FROM public_modules WHERE project_id = $1 AND id = $2',
          [projectId, moduleId],
        )
        return exists.rowCount ? 'conflict' : 'missing'
      }
      await this.replaceReferences(client, 'owner_module_id', moduleId, projectId, references)
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
      return 'saved'
    })
    if (status === 'conflict') return 'conflict'
    if (status === 'missing') return null
    return this.findModule(projectId, moduleId)
  }

  async publishModule(
    projectId: string,
    moduleId: string,
    expectedRevision: number,
    versionNo: number,
    schema: PublicModuleRecord['schema'],
    references: ModuleReferenceInput[],
  ): Promise<PublicModuleRecord | 'conflict' | null> {
    const status = await this.database.withTransaction(async (client) => {
      const current = await client.query<{ revision: string }>(
        `
          SELECT revision
          FROM public_modules
          WHERE project_id = $1 AND id = $2
          FOR UPDATE
        `,
        [projectId, moduleId],
      )
      if (!current.rows[0]) return 'missing'
      if (Number(current.rows[0].revision) !== expectedRevision) return 'conflict'

      const version = await client.query<{ id: string }>(
        `
          INSERT INTO public_module_versions (project_id, module_id, version_no, schema)
          VALUES ($1, $2, $3, $4::jsonb)
          RETURNING id
        `,
        [projectId, moduleId, versionNo, JSON.stringify(schema)],
      )
      const versionId = version.rows[0]!.id
      await client.query(
        `
          UPDATE public_modules
          SET published_version_id = $3, revision = revision + 1, updated_at = now()
          WHERE project_id = $1 AND id = $2
        `,
        [projectId, moduleId, versionId],
      )
      await client.query(
        `
          UPDATE module_references
          SET referenced_version_no = $3
          WHERE
            project_id = $1
            AND referenced_module_id = $2
            AND update_policy = 'latest'
            AND (owner_page_id IS NOT NULL OR owner_module_id IS NOT NULL)
        `,
        [projectId, moduleId, versionNo],
      )
      await this.replaceReferences(
        client,
        'owner_module_version_id',
        versionId,
        projectId,
        references,
      )
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
      return 'published'
    })
    if (status === 'conflict') return 'conflict'
    if (status === 'missing') return null
    return this.findModule(projectId, moduleId)
  }

  async getModuleReferenceState(
    moduleId: string,
  ): Promise<{ pageIds: string[]; moduleIds: string[]; referenceCount: number }> {
    const [pages, modules, count] = await Promise.all([
      this.database.query<{ page_id: string }>(
        `
        SELECT DISTINCT owner_page_id AS page_id
        FROM module_references
        WHERE referenced_module_id = $1 AND owner_page_id IS NOT NULL
        ORDER BY owner_page_id
      `,
        [moduleId],
      ),
      this.database.query<{ module_id: string }>(
        `
        SELECT DISTINCT owner_module_id AS module_id
        FROM module_references
        WHERE referenced_module_id = $1 AND owner_module_id IS NOT NULL
        ORDER BY owner_module_id
      `,
        [moduleId],
      ),
      this.database.query<{ count: number }>(
        `
          SELECT count(*)::integer AS count
          FROM module_references
          WHERE referenced_module_id = $1
        `,
        [moduleId],
      ),
    ])
    return {
      pageIds: pages.rows.map((row) => row.page_id),
      moduleIds: modules.rows.map((row) => row.module_id),
      referenceCount: count.rows[0]?.count ?? 0,
    }
  }

  async deleteModule(projectId: string, moduleId: string): Promise<boolean> {
    const result = await this.database.query(
      `
        WITH deleted AS (
          DELETE FROM public_modules
          WHERE project_id = $1 AND id = $2
          RETURNING project_id
        )
        UPDATE projects
        SET updated_at = now()
        WHERE id = $1 AND EXISTS (SELECT 1 FROM deleted)
      `,
      [projectId, moduleId],
    )
    return (result.rowCount ?? 0) > 0
  }

  private async findPage(projectId: string, pageId: string): Promise<ProjectPageRecord | null> {
    const pages = await this.listPages(projectId)
    return pages.find((page) => page.id === pageId) ?? null
  }

  private async findModule(
    projectId: string,
    moduleId: string,
  ): Promise<PublicModuleRecord | null> {
    const modules = await this.listModules(projectId)
    return modules.find((module) => module.id === moduleId) ?? null
  }

  private async replaceReferences(
    client: PoolClient,
    ownerColumn:
      | 'owner_page_id'
      | 'owner_page_version_id'
      | 'owner_module_id'
      | 'owner_module_version_id',
    ownerId: string,
    projectId: string,
    references: ModuleReferenceInput[],
  ): Promise<void> {
    await client.query(`DELETE FROM module_references WHERE ${ownerColumn} = $1`, [ownerId])
    for (const reference of references) {
      await client.query(
        `
          INSERT INTO module_references (
            project_id,
            ${ownerColumn},
            node_id,
            referenced_module_id,
            referenced_version_no,
            update_policy
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          projectId,
          ownerId,
          reference.nodeId,
          reference.moduleId,
          reference.versionNo,
          reference.updatePolicy,
        ],
      )
    }
  }

  private toSystem(row: SystemRow): BusinessSystem {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      sortOrder: row.sort_order,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }
  }

  private toProject(row: ProjectRow): DesignProject {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      systemId: row.system_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      lastOpenedAt: row.last_opened_at?.toISOString() ?? null,
      lastEditedPageId: row.last_edited_page_id,
      isFavorite: row.is_favorite,
      pageCount: row.page_count,
      moduleCount: row.module_count,
    }
  }

  private toPage(row: PageRow): ProjectPageRecord {
    return {
      id: row.id,
      projectId: row.project_id,
      schema: row.draft_schema as ProjectPageRecord['schema'],
      revision: Number(row.revision),
      publishedVersionId: row.published_version_id,
      moduleReferenceCount: row.module_reference_count,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }
  }

  private toModule(row: ModuleRow, versions: StoredPublicModuleVersion[]): PublicModuleRecord {
    return {
      id: row.id,
      projectId: row.project_id,
      schema: row.draft_schema as PublicModuleRecord['schema'],
      revision: Number(row.revision),
      publishedVersionId: row.published_version_id,
      version:
        versions.find((version) => version.id === row.published_version_id)?.version ?? 'draft',
      versions,
      referenceCount: row.reference_count,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }
  }
}
