import { pageSchema } from '@ai-design/contracts/page'
import type { ProjectPageRecord } from '@ai-design/contracts/workspace'
import { Injectable } from '@nestjs/common'

import { DatabaseService } from '../database/database.service.js'
import type { ModuleReferenceInput } from './module-reference.repository.js'
import { ModuleReferenceRepository } from './module-reference.repository.js'

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

@Injectable()
export class PageRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly moduleReferences: ModuleReferenceRepository,
  ) {}

  listPages(projectId: string): Promise<ProjectPageRecord[]> {
    return this.queryPages(projectId)
  }

  async getPage(projectId: string, pageId: string): Promise<ProjectPageRecord | null> {
    return (await this.queryPages(projectId, pageId))[0] ?? null
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
          WHERE projects.id = $2 AND projects.deleted_at IS NULL
        `,
        [schema.id, projectId, JSON.stringify(schema)],
      )
      if ((insert.rowCount ?? 0) === 0) return
      await this.moduleReferences.replaceReferences(
        client,
        'owner_page_id',
        schema.id,
        projectId,
        references,
      )
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
          WHERE projects.id = $1 AND projects.deleted_at IS NULL
          ON CONFLICT (workspace_id, user_id, project_id) DO UPDATE
          SET last_edited_page_id = $3, last_opened_at = now(), updated_at = now()
        `,
        [projectId, userId, schema.id],
      )
    })
    return this.getPage(projectId, schema.id)
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
          WHERE project_id = $1 AND id = $2 AND revision = $3 AND deleted_at IS NULL
        `,
        [projectId, pageId, expectedRevision, JSON.stringify(schema)],
      )
      if ((update.rowCount ?? 0) === 0) {
        const exists = await client.query(
          'SELECT 1 FROM pages WHERE project_id = $1 AND id = $2 AND deleted_at IS NULL',
          [projectId, pageId],
        )
        return exists.rowCount ? 'conflict' : 'missing'
      }
      await this.moduleReferences.replaceReferences(
        client,
        'owner_page_id',
        pageId,
        projectId,
        references,
      )
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
      return 'saved'
    })
    if (status === 'conflict') return 'conflict'
    if (status === 'missing') return null
    return this.getPage(projectId, pageId)
  }

  async deletePage(projectId: string, pageId: string): Promise<boolean> {
    return this.database.withTransaction(async (client) => {
      const page = await client.query(
        `
          SELECT id
          FROM pages
          WHERE project_id = $1 AND id = $2 AND deleted_at IS NULL
          FOR UPDATE
        `,
        [projectId, pageId],
      )
      if ((page.rowCount ?? 0) === 0) return false

      await client.query('UPDATE pages SET deleted_at = now(), updated_at = now() WHERE id = $1', [
        pageId,
      ])
      await client.query(
        `
          UPDATE user_project_preferences
          SET last_edited_page_id = NULL, updated_at = now()
          WHERE project_id = $1 AND last_edited_page_id = $2
        `,
        [projectId, pageId],
      )
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
      return true
    })
  }

  private async queryPages(projectId: string, pageId?: string): Promise<ProjectPageRecord[]> {
    const pageFilter = pageId ? 'AND pages.id = $2' : ''
    const values = pageId ? [projectId, pageId] : [projectId]
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
        WHERE pages.project_id = $1 AND pages.deleted_at IS NULL ${pageFilter}
        ORDER BY pages.updated_at DESC, pages.id
      `,
      values,
    )
    return result.rows.map((row) => this.toPage(row))
  }

  private toPage(row: PageRow): ProjectPageRecord {
    const schema = pageSchema.safeParse(row.draft_schema)
    if (!schema.success) {
      throw new Error(`Invalid persisted page schema: ${row.id}`, { cause: schema.error })
    }
    return {
      id: row.id,
      projectId: row.project_id,
      schema: schema.data,
      revision: Number(row.revision),
      publishedVersionId: row.published_version_id,
      moduleReferenceCount: row.module_reference_count,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }
  }
}
