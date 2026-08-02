import type { WorkspaceRole } from '@ai-design/contracts/workspace'

export interface WorkspaceAccess {
  workspaceId: string
  role: WorkspaceRole
}
