import type { AuthUser } from '@ai-design/contracts/auth'
import type { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  auth: {
    userId: string
    sessionToken: string
    user: AuthUser
  }
}
