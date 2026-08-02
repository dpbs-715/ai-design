import type { AuthUser } from '@ai-design/contracts/auth'
import { DEFAULT_BUSINESS_SYSTEM_SEED } from '@ai-design/contracts/workspace'
import { Injectable } from '@nestjs/common'

import { DatabaseService } from '../database/database.service.js'

interface UserRow {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  status: 'active' | 'disabled'
  email_verified_at: Date | null
}

export interface LoginAccount extends AuthUser {
  passwordHash: string
}

@Injectable()
export class AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  async emailExists(email: string): Promise<boolean> {
    const result = await this.database.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM users WHERE lower(email) = lower($1)) AS exists',
      [email],
    )

    return result.rows[0]?.exists ?? false
  }

  async createUser(
    email: string,
    displayName: string,
    passwordHash: string,
  ): Promise<AuthUser | null> {
    return this.database.withTransaction(async (client) => {
      const userResult = await client.query<UserRow>(
        `
          INSERT INTO users (email, display_name, email_verified_at)
          VALUES ($1, $2, now())
          ON CONFLICT (lower(email)) DO NOTHING
          RETURNING id, email, display_name, avatar_url, status, email_verified_at
        `,
        [email, displayName],
      )
      const user = userResult.rows[0]

      if (!user) {
        return null
      }

      await client.query(
        `
          INSERT INTO user_password_credentials (user_id, password_hash)
          VALUES ($1, $2)
        `,
        [user.id, passwordHash],
      )

      const workspaceResult = await client.query<{ id: string }>(
        `
          INSERT INTO workspaces (name)
          VALUES ($1)
          RETURNING id
        `,
        [`${displayName}的工作区`],
      )
      const workspace = workspaceResult.rows[0]

      if (!workspace) {
        throw new Error('Failed to create default workspace')
      }

      await client.query(
        `
          INSERT INTO workspace_members (workspace_id, user_id, role)
          VALUES ($1, $2, 'owner')
        `,
        [workspace.id, user.id],
      )

      await client.query(
        `
          INSERT INTO business_systems (workspace_id, name, description, icon)
          VALUES ($1, $2, $3, $4)
        `,
        [
          workspace.id,
          DEFAULT_BUSINESS_SYSTEM_SEED.name,
          DEFAULT_BUSINESS_SYSTEM_SEED.description,
          DEFAULT_BUSINESS_SYSTEM_SEED.icon,
        ],
      )

      return this.toAuthUser(user)
    })
  }

  async findLoginAccount(email: string): Promise<LoginAccount | null> {
    const result = await this.database.query<
      UserRow & {
        password_hash: string
      }
    >(
      `
        SELECT
          u.id,
          u.email,
          u.display_name,
          u.avatar_url,
          u.status,
          u.email_verified_at,
          credentials.password_hash
        FROM users AS u
        INNER JOIN user_password_credentials AS credentials
          ON credentials.user_id = u.id
        WHERE lower(u.email) = lower($1)
      `,
      [email],
    )
    const account = result.rows[0]

    if (!account) {
      return null
    }

    return {
      ...this.toAuthUser(account),
      passwordHash: account.password_hash,
    }
  }

  async findUserById(userId: string): Promise<AuthUser | null> {
    const result = await this.database.query<UserRow>(
      `
        SELECT id, email, display_name, avatar_url, status, email_verified_at
        FROM users
        WHERE id = $1
      `,
      [userId],
    )
    const user = result.rows[0]

    return user ? this.toAuthUser(user) : null
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    await this.database.query(
      `
        UPDATE users
        SET last_login_at = now(), updated_at = now()
        WHERE id = $1
      `,
      [userId],
    )
  }

  private toAuthUser(row: UserRow): AuthUser {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      status: row.status,
      emailVerifiedAt: row.email_verified_at?.toISOString() ?? null,
    }
  }
}
