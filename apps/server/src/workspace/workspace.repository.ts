import type {
  BusinessSystem,
  WorkspaceRole,
  WorkspaceSummary,
} from '@ai-design/contracts/workspace'
import { Injectable } from '@nestjs/common'

import { DatabaseService } from '../database/database.service.js'
import type { WorkspaceAccess } from './workspace-access.types.js'

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

interface WorkspaceDetails {
  id: string
  name: string
}

export type DeleteSystemResult = 'deleted' | 'last-system' | 'not-empty' | 'not-found'

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

  async getWorkspace(workspaceId: string): Promise<WorkspaceDetails | null> {
    const result = await this.database.query<{ id: string; name: string }>(
      'SELECT id, name FROM workspaces WHERE id = $1',
      [workspaceId],
    )
    return result.rows[0] ?? null
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
      const system = await client.query(
        `
          SELECT id
          FROM business_systems
          WHERE workspace_id = $1 AND id = $2
          FOR UPDATE
        `,
        [workspaceId, systemId],
      )
      if ((system.rowCount ?? 0) === 0) return 'not-found'

      const state = await client.query<{ count: number }>(
        `
          SELECT count(*)::integer AS count
          FROM business_systems
          WHERE workspace_id = $1
        `,
        [workspaceId],
      )
      const current = state.rows[0]
      if (!current || current.count <= 1) return 'last-system'

      const project = await client.query(
        'SELECT 1 FROM projects WHERE workspace_id = $1 AND system_id = $2 LIMIT 1',
        [workspaceId, systemId],
      )
      if ((project.rowCount ?? 0) > 0) return 'not-empty'

      await client.query('DELETE FROM business_systems WHERE workspace_id = $1 AND id = $2', [
        workspaceId,
        systemId,
      ])
      return 'deleted'
    })
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
}
