import type { TrashItem, TrashResourceType } from '@ai-design/contracts/workspace'
import { Injectable } from '@nestjs/common'

import { DatabaseService } from '../database/database.service.js'

interface TrashRow {
  type: TrashResourceType
  id: string
  name: string
  project_id: string | null
  project_name: string | null
  deleted_at: Date
  expires_at: Date
}

@Injectable()
export class TrashRepository {
  constructor(private readonly database: DatabaseService) {}

  async listItems(workspaceId: string, retentionDays: number): Promise<TrashItem[]> {
    const result = await this.database.query<TrashRow>(
      `
        SELECT
          'project'::text AS type,
          projects.id,
          projects.name,
          NULL::uuid AS project_id,
          NULL::text AS project_name,
          projects.deleted_at,
          projects.deleted_at + make_interval(days => $2::integer) AS expires_at
        FROM projects
        WHERE projects.workspace_id = $1 AND projects.deleted_at IS NOT NULL

        UNION ALL

        SELECT
          'page'::text AS type,
          pages.id,
          pages.name,
          projects.id AS project_id,
          projects.name AS project_name,
          pages.deleted_at,
          pages.deleted_at + make_interval(days => $2::integer) AS expires_at
        FROM pages
        INNER JOIN projects ON projects.id = pages.project_id
        WHERE
          projects.workspace_id = $1
          AND projects.deleted_at IS NULL
          AND pages.deleted_at IS NOT NULL

        UNION ALL

        SELECT
          'public-module'::text AS type,
          modules.id,
          modules.name,
          projects.id AS project_id,
          projects.name AS project_name,
          modules.deleted_at,
          modules.deleted_at + make_interval(days => $2::integer) AS expires_at
        FROM public_modules AS modules
        INNER JOIN projects ON projects.id = modules.project_id
        WHERE
          projects.workspace_id = $1
          AND projects.deleted_at IS NULL
          AND modules.deleted_at IS NOT NULL

        ORDER BY deleted_at DESC, id
      `,
      [workspaceId, retentionDays],
    )
    return result.rows.map((row) => ({
      type: row.type,
      id: row.id,
      name: row.name,
      projectId: row.project_id,
      projectName: row.project_name,
      deletedAt: row.deleted_at.toISOString(),
      expiresAt: row.expires_at.toISOString(),
    }))
  }

  restore(workspaceId: string, type: TrashResourceType, resourceId: string): Promise<boolean> {
    if (type === 'project') {
      return this.restoreProject(workspaceId, resourceId)
    }
    return this.restoreProjectAsset(workspaceId, type, resourceId)
  }

  permanentlyDelete(
    workspaceId: string,
    type: TrashResourceType,
    resourceId: string,
  ): Promise<boolean> {
    if (type === 'project') {
      return this.permanentlyDeleteProject(workspaceId, resourceId)
    }
    return this.permanentlyDeleteProjectAsset(workspaceId, type, resourceId)
  }

  async purgeExpired(retentionDays: number): Promise<void> {
    await this.database.withTransaction(async (client) => {
      await client.query(
        `
          DELETE FROM pages
          USING projects
          WHERE
            pages.project_id = projects.id
            AND pages.deleted_at < now() - make_interval(days => $1::integer)
        `,
        [retentionDays],
      )
      await client.query(
        `
          DELETE FROM public_modules AS modules
          USING projects
          WHERE
            modules.project_id = projects.id
            AND modules.deleted_at < now() - make_interval(days => $1::integer)
            AND NOT EXISTS (
              SELECT 1
              FROM module_references AS refs
              WHERE refs.referenced_module_id = modules.id
            )
        `,
        [retentionDays],
      )
      await client.query(
        `
          DELETE FROM projects
          WHERE deleted_at < now() - make_interval(days => $1::integer)
        `,
        [retentionDays],
      )
    })
  }

  private async restoreProject(workspaceId: string, projectId: string): Promise<boolean> {
    const result = await this.database.query(
      `
        UPDATE projects
        SET deleted_at = NULL, updated_at = now()
        WHERE workspace_id = $1 AND id = $2 AND deleted_at IS NOT NULL
      `,
      [workspaceId, projectId],
    )
    return (result.rowCount ?? 0) > 0
  }

  private async restoreProjectAsset(
    workspaceId: string,
    type: Exclude<TrashResourceType, 'project'>,
    resourceId: string,
  ): Promise<boolean> {
    const table = type === 'page' ? 'pages' : 'public_modules'
    const result = await this.database.query(
      `
        UPDATE ${table} AS assets
        SET deleted_at = NULL, updated_at = now()
        FROM projects
        WHERE
          assets.project_id = projects.id
          AND projects.workspace_id = $1
          AND projects.deleted_at IS NULL
          AND assets.id = $2
          AND assets.deleted_at IS NOT NULL
      `,
      [workspaceId, resourceId],
    )
    return (result.rowCount ?? 0) > 0
  }

  private async permanentlyDeleteProject(workspaceId: string, projectId: string): Promise<boolean> {
    const result = await this.database.query(
      `
        DELETE FROM projects
        WHERE workspace_id = $1 AND id = $2 AND deleted_at IS NOT NULL
      `,
      [workspaceId, projectId],
    )
    return (result.rowCount ?? 0) > 0
  }

  private async permanentlyDeleteProjectAsset(
    workspaceId: string,
    type: Exclude<TrashResourceType, 'project'>,
    resourceId: string,
  ): Promise<boolean> {
    const table = type === 'page' ? 'pages' : 'public_modules'
    const result = await this.database.query(
      `
        DELETE FROM ${table} AS assets
        USING projects
        WHERE
          assets.project_id = projects.id
          AND projects.workspace_id = $1
          AND projects.deleted_at IS NULL
          AND assets.id = $2
          AND assets.deleted_at IS NOT NULL
      `,
      [workspaceId, resourceId],
    )
    return (result.rowCount ?? 0) > 0
  }
}
