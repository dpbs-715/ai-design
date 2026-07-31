import type { ZodType } from 'zod'

interface ApiErrorPayload {
  message?: string | string[]
  issues?: Array<{ message?: string }>
  [key: string]: unknown
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly payload?: ApiErrorPayload,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function errorMessage(payload: ApiErrorPayload | undefined, fallback: string) {
  const issueMessage = payload?.issues?.find((issue) => issue.message)?.message
  if (issueMessage) return issueMessage
  if (Array.isArray(payload?.message)) return payload.message[0] ?? fallback
  return payload?.message ?? fallback
}

async function parseJson(response: Response): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes('application/json')) return undefined
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

async function fetchApi(path: string, options?: RequestInit) {
  const headers = new Headers(options?.headers)
  if (typeof options?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    return await fetch(`/api${path}`, {
      ...options,
      credentials: 'include',
      headers,
    })
  } catch {
    throw new ApiError(0, '无法连接服务端，请确认服务已启动')
  }
}

export async function apiRequest<ResponseBody>(
  path: string,
  schema: ZodType<ResponseBody>,
  options?: RequestInit,
): Promise<ResponseBody> {
  const response = await fetchApi(path, options)
  const payload = await parseJson(response)
  if (!response.ok) {
    throw new ApiError(
      response.status,
      errorMessage(payload as ApiErrorPayload | undefined, '请求处理失败，请稍后重试'),
      payload as ApiErrorPayload | undefined,
    )
  }

  const result = schema.safeParse(payload)
  if (!result.success) throw new ApiError(response.status, '服务端返回了无法识别的数据')
  return result.data
}

export async function apiNoContent(path: string, options?: RequestInit): Promise<void> {
  const response = await fetchApi(path, options)
  if (response.ok) return
  const payload = (await parseJson(response)) as ApiErrorPayload | undefined
  throw new ApiError(response.status, errorMessage(payload, '请求处理失败，请稍后重试'), payload)
}
