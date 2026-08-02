import { publicModuleSchema } from '@ai-design/contracts/module'
import type {
  PublicModuleRecord,
  PublicModuleVersionList,
  StoredPublicModuleVersion,
} from '@ai-design/contracts/workspace'
import { Injectable } from '@nestjs/common'

import { DatabaseService } from '../database/database.service.js'
import type { ModuleReferenceInput } from './module-reference.repository.js'
import { ModuleReferenceRepository } from './module-reference.repository.js'

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

interface ModuleVersionListRow {
  module_id: string
  revision: string
  published_version_id: string | null
  versions: ModuleVersionJson[]
}

interface ModuleWithVersionsRow extends ModuleRow {
  versions: ModuleVersionJson[]
}

@Injectable()
export class PublicModuleRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly moduleReferences: ModuleReferenceRepository,
  ) {}

  listModules(projectId: string): Promise<PublicModuleRecord[]> {
    return this.queryModules(projectId)
  }

  async getModule(projectId: string, moduleId: string): Promise<PublicModuleRecord | null> {
    return (await this.queryModules(projectId, moduleId))[0] ?? null
  }

  async listModuleVersions(projectId: string): Promise<PublicModuleVersionList[]> {
    const result = await this.database.query<ModuleVersionListRow>(
      `
        SELECT
          modules.id AS module_id,
          modules.revision,
          modules.published_version_id,
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
        WHERE modules.project_id = $1 AND modules.deleted_at IS NULL
        GROUP BY modules.id
        ORDER BY modules.id
      `,
      [projectId],
    )
    return result.rows.map((row) => ({
      moduleId: row.module_id,
      revision: Number(row.revision),
      publishedVersionId: row.published_version_id,
      versions: row.versions.map((version) => this.toVersion(version)),
    }))
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
          WHERE projects.id = $2 AND projects.deleted_at IS NULL
        `,
        [schema.moduleId, projectId, JSON.stringify(schema)],
      )
      if ((insert.rowCount ?? 0) === 0) return
      await this.moduleReferences.replaceReferences(
        client,
        'owner_module_id',
        schema.moduleId,
        projectId,
        references,
      )
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
    })
    return this.getModule(projectId, schema.moduleId)
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
          WHERE project_id = $1 AND id = $2 AND revision = $3 AND deleted_at IS NULL
        `,
        [projectId, moduleId, expectedRevision, JSON.stringify(schema)],
      )
      if ((update.rowCount ?? 0) === 0) {
        const exists = await client.query(
          'SELECT 1 FROM public_modules WHERE project_id = $1 AND id = $2 AND deleted_at IS NULL',
          [projectId, moduleId],
        )
        return exists.rowCount ? 'conflict' : 'missing'
      }
      await this.moduleReferences.replaceReferences(
        client,
        'owner_module_id',
        moduleId,
        projectId,
        references,
      )
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
      return 'saved'
    })
    if (status === 'conflict') return 'conflict'
    if (status === 'missing') return null
    return this.getModule(projectId, moduleId)
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
          WHERE project_id = $1 AND id = $2 AND deleted_at IS NULL
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
          WHERE project_id = $1 AND id = $2 AND deleted_at IS NULL
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
      await this.moduleReferences.replaceReferences(
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
    return this.getModule(projectId, moduleId)
  }

  async deleteModule(
    projectId: string,
    moduleId: string,
  ): Promise<'deleted' | 'referenced' | 'missing'> {
    return this.database.withTransaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [moduleId])
      const module = await client.query(
        `
          SELECT 1
          FROM public_modules
          WHERE project_id = $1 AND id = $2 AND deleted_at IS NULL
        `,
        [projectId, moduleId],
      )
      if (!module.rowCount) return 'missing'

      const references = await client.query(
        'SELECT 1 FROM module_references WHERE referenced_module_id = $1 LIMIT 1',
        [moduleId],
      )
      if (references.rowCount) return 'referenced'

      await client.query(
        `
          UPDATE public_modules
          SET deleted_at = now(), updated_at = now()
          WHERE project_id = $1 AND id = $2 AND deleted_at IS NULL
        `,
        [projectId, moduleId],
      )
      await client.query('UPDATE projects SET updated_at = now() WHERE id = $1', [projectId])
      return 'deleted'
    })
  }

  private async queryModules(projectId: string, moduleId?: string): Promise<PublicModuleRecord[]> {
    const moduleFilter = moduleId ? 'AND modules.id = $2' : ''
    const values = moduleId ? [projectId, moduleId] : [projectId]
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
            WHERE
              referenced_module_id = modules.id
              AND owner_page_id IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM pages
                WHERE pages.id = owner_page_id AND pages.deleted_at IS NULL
              )
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
        LEFT JOIN public_module_versions AS versions
          ON versions.id = modules.published_version_id
        WHERE modules.project_id = $1 AND modules.deleted_at IS NULL ${moduleFilter}
        GROUP BY modules.id
        ORDER BY modules.updated_at DESC, modules.id
      `,
      values,
    )
    return result.rows.map((row) => this.toModule(row))
  }

  private toModule(row: ModuleWithVersionsRow): PublicModuleRecord {
    const schema = this.parseSchema(row.draft_schema, row.id)
    const versions = row.versions.map((version) => this.toVersion(version))
    return {
      id: row.id,
      projectId: row.project_id,
      schema,
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

  private parseSchema(schema: unknown, moduleId: string): StoredPublicModuleVersion['schema'] {
    const result = publicModuleSchema.safeParse(schema)
    if (!result.success) {
      throw new Error(`Invalid persisted public module schema: ${moduleId}`, {
        cause: result.error,
      })
    }
    return result.data
  }

  private toVersion(version: ModuleVersionJson): StoredPublicModuleVersion {
    return {
      id: version.id,
      version: `v${version.version_no}`,
      schema: this.parseSchema(version.schema, version.id),
      publishedAt: new Date(version.published_at).toISOString(),
    }
  }
}
