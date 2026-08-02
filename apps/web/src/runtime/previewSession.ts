import type { PageSchema } from '@/schema/page.ts'
import { parsePageSchema } from '@/schema/validation.ts'

const PREVIEW_SESSION_KEY_PREFIX = 'ai-design:preview:'

interface PreviewSessionPayload {
  assetId: string
  projectId: string
  schema: PageSchema
}

function sessionKey(token: string) {
  return `${PREVIEW_SESSION_KEY_PREFIX}${token}`
}

export function createPreviewSession(
  assetId: string,
  projectId: string,
  schema: PageSchema,
): string {
  const token = crypto.randomUUID()
  sessionStorage.setItem(sessionKey(token), JSON.stringify({ assetId, projectId, schema }))
  return token
}

export function discardPreviewSession(token: string): void {
  sessionStorage.removeItem(sessionKey(token))
}

export function consumePreviewSession(token: string): PreviewSessionPayload | undefined {
  const key = sessionKey(token)
  const serialized = sessionStorage.getItem(key)
  sessionStorage.removeItem(key)
  if (!serialized) return undefined

  try {
    const payload = JSON.parse(serialized) as Partial<PreviewSessionPayload>
    if (typeof payload.assetId !== 'string' || typeof payload.projectId !== 'string') {
      return undefined
    }
    const schema = parsePageSchema(payload.schema)
    if (!schema.success) return undefined
    return { assetId: payload.assetId, projectId: payload.projectId, schema: schema.data }
  } catch {
    return undefined
  }
}
