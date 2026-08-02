import { Injectable } from '@nestjs/common'
import type { ModuleDeletionBlockers } from '@ai-design/contracts/workspace'
import type { PoolClient } from 'pg'

import { DatabaseService } from '../database/database.service.js'
import { InvalidModuleReferenceError } from './workspace-errors.js'

export interface ModuleReferenceInput {
  nodeId: string
  moduleId: string
  versionNo: number
  updatePolicy: 'manual' | 'latest'
}

export type ModuleReferenceOwnerColumn =
  | 'owner_page_id'
  | 'owner_page_version_id'
  | 'owner_module_id'
  | 'owner_module_version_id'

@Injectable()
export class ModuleReferenceRepository {
  constructor(private readonly database: DatabaseService) {}

  async listPageReferenceCounts(
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
          AND EXISTS (
            SELECT 1
            FROM pages
            WHERE pages.id = refs.owner_page_id AND pages.deleted_at IS NULL
          )
        WHERE modules.project_id = $1 AND modules.deleted_at IS NULL
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

  async getModuleReferenceState(
    projectId: string,
    moduleId: string,
  ): Promise<ModuleDeletionBlockers> {
    const result = await this.database.query<{
      active_page_ids: string[]
      trashed_page_ids: string[]
      historical_page_ids: string[]
      active_module_ids: string[]
      trashed_module_ids: string[]
      historical_module_ids: string[]
      reference_count: number
    }>(
      `
        SELECT
          COALESCE(
            array_agg(DISTINCT refs.owner_page_id ORDER BY refs.owner_page_id)
              FILTER (WHERE refs.owner_page_id IS NOT NULL AND pages.deleted_at IS NULL),
            '{}'::uuid[]
          ) AS active_page_ids,
          COALESCE(
            array_agg(DISTINCT refs.owner_page_id ORDER BY refs.owner_page_id)
              FILTER (WHERE refs.owner_page_id IS NOT NULL AND pages.deleted_at IS NOT NULL),
            '{}'::uuid[]
          ) AS trashed_page_ids,
          COALESCE(
            array_agg(DISTINCT page_versions.page_id ORDER BY page_versions.page_id)
              FILTER (WHERE refs.owner_page_version_id IS NOT NULL),
            '{}'::uuid[]
          ) AS historical_page_ids,
          COALESCE(
            array_agg(DISTINCT refs.owner_module_id ORDER BY refs.owner_module_id)
              FILTER (
                WHERE refs.owner_module_id IS NOT NULL AND owner_modules.deleted_at IS NULL
              ),
            '{}'::uuid[]
          ) AS active_module_ids,
          COALESCE(
            array_agg(DISTINCT refs.owner_module_id ORDER BY refs.owner_module_id)
              FILTER (
                WHERE refs.owner_module_id IS NOT NULL AND owner_modules.deleted_at IS NOT NULL
              ),
            '{}'::uuid[]
          ) AS trashed_module_ids,
          COALESCE(
            array_agg(DISTINCT module_versions.module_id ORDER BY module_versions.module_id)
              FILTER (WHERE refs.owner_module_version_id IS NOT NULL),
            '{}'::uuid[]
          ) AS historical_module_ids,
          count(*)::integer AS reference_count
        FROM module_references AS refs
        LEFT JOIN pages ON pages.id = refs.owner_page_id
        LEFT JOIN page_versions ON page_versions.id = refs.owner_page_version_id
        LEFT JOIN public_modules AS owner_modules ON owner_modules.id = refs.owner_module_id
        LEFT JOIN public_module_versions AS module_versions
          ON module_versions.id = refs.owner_module_version_id
        WHERE refs.project_id = $1 AND refs.referenced_module_id = $2
      `,
      [projectId, moduleId],
    )
    const blockers = result.rows[0]!
    return {
      activePageIds: blockers.active_page_ids,
      trashedPageIds: blockers.trashed_page_ids,
      historicalPageIds: blockers.historical_page_ids,
      activeModuleIds: blockers.active_module_ids,
      trashedModuleIds: blockers.trashed_module_ids,
      historicalModuleIds: blockers.historical_module_ids,
      referenceCount: blockers.reference_count,
    }
  }

  async replaceReferences(
    client: PoolClient,
    ownerColumn: ModuleReferenceOwnerColumn,
    ownerId: string,
    projectId: string,
    references: ModuleReferenceInput[],
  ): Promise<void> {
    const referencedModuleIds = [
      ...new Set(references.map((reference) => reference.moduleId)),
    ].sort()
    for (const moduleId of referencedModuleIds) {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [moduleId])
    }
    await client.query(`DELETE FROM module_references WHERE ${ownerColumn} = $1`, [ownerId])
    for (const reference of references) {
      const inserted = await client.query(
        `
          INSERT INTO module_references (
            project_id,
            ${ownerColumn},
            node_id,
            referenced_module_id,
            referenced_version_no,
            update_policy
          )
          SELECT $1, $2, $3, modules.id, versions.version_no, $6
          FROM public_modules AS modules
          INNER JOIN public_module_versions AS versions
            ON versions.module_id = modules.id AND versions.version_no = $5
          WHERE
            modules.project_id = $1
            AND modules.id = $4
            AND modules.deleted_at IS NULL
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
      if ((inserted.rowCount ?? 0) === 0) throw new InvalidModuleReferenceError()
    }
  }
}
