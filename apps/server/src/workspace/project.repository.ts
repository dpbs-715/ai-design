import type { DesignProject, WorkspaceRole } from '@ai-design/contracts/workspace'
import { Injectable } from '@nestjs/common'

import { DatabaseService } from '../database/database.service.js'
import type { WorkspaceAccess } from './workspace-access.types.js'

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

@Injectable()
export class ProjectRepository {
  constructor(private readonly database: DatabaseService) {}

  async findProjectAccess(userId: string, projectId: string): Promise<WorkspaceAccess | null> {
    const result = await this.database.query<{ workspace_id: string; role: WorkspaceRole }>(
      `
        SELECT projects.workspace_id, members.role
        FROM projects
        INNER JOIN workspace_members AS members
          ON members.workspace_id = projects.workspace_id
        WHERE projects.id = $1 AND projects.deleted_at IS NULL AND members.user_id = $2
      `,
      [projectId, userId],
    )
    const row = result.rows[0]
    return row ? { workspaceId: row.workspace_id, role: row.role } : null
  }

  listProjects(workspaceId: string, userId: string): Promise<DesignProject[]> {
    return this.queryProjects(workspaceId, userId)
  }

  async getProject(
    workspaceId: string,
    userId: string,
    projectId: string,
  ): Promise<DesignProject | null> {
    return (await this.queryProjects(workspaceId, userId, projectId))[0] ?? null
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
        WHERE workspace_id = $1 AND id = $2 AND deleted_at IS NULL
      `,
      [workspaceId, projectId, input.name ?? null, input.description ?? null],
    )
    return (result.rowCount ?? 0) > 0
  }

  async deleteProject(workspaceId: string, projectId: string): Promise<boolean> {
    const result = await this.database.query(
      `
        UPDATE projects
        SET deleted_at = now(), updated_at = now()
        WHERE workspace_id = $1 AND id = $2 AND deleted_at IS NULL
      `,
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
  ): Promise<boolean> {
    const result = await this.database.query(
      `
        INSERT INTO user_project_preferences (
          workspace_id,
          user_id,
          project_id,
          is_favorite,
          last_opened_at,
          last_edited_page_id
        )
        SELECT
          $1,
          $2,
          $3,
          COALESCE($4, false),
          CASE WHEN $5::boolean THEN now() ELSE NULL END,
          $6
        WHERE
          NOT $7::boolean
          OR $6::uuid IS NULL
          OR EXISTS (
            SELECT 1
            FROM pages
            WHERE pages.id = $6 AND pages.project_id = $3 AND pages.deleted_at IS NULL
            FOR SHARE
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
    return (result.rowCount ?? 0) > 0
  }

  private async queryProjects(
    workspaceId: string,
    userId: string,
    projectId?: string,
  ): Promise<DesignProject[]> {
    const projectFilter = projectId ? 'AND projects.id = $3' : ''
    const values = projectId ? [workspaceId, userId, projectId] : [workspaceId, userId]
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
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM pages AS recent_page
              WHERE
                recent_page.id = preferences.last_edited_page_id
                AND recent_page.project_id = projects.id
                AND recent_page.deleted_at IS NULL
            ) THEN preferences.last_edited_page_id
            ELSE NULL
          END AS last_edited_page_id,
          COALESCE(preferences.is_favorite, false) AS is_favorite,
          (
            SELECT count(*)::integer
            FROM pages
            WHERE pages.project_id = projects.id AND pages.deleted_at IS NULL
          ) AS page_count,
          (
            SELECT count(*)::integer
            FROM public_modules
            WHERE public_modules.project_id = projects.id AND public_modules.deleted_at IS NULL
          ) AS module_count
        FROM projects
        LEFT JOIN user_project_preferences AS preferences
          ON preferences.workspace_id = projects.workspace_id
          AND preferences.project_id = projects.id
          AND preferences.user_id = $2
        WHERE projects.workspace_id = $1 AND projects.deleted_at IS NULL ${projectFilter}
        ORDER BY projects.updated_at DESC, projects.id
      `,
      values,
    )
    return result.rows.map((row) => this.toProject(row))
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
}
