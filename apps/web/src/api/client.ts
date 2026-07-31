import axios, { type AxiosRequestConfig } from 'axios'
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

function toApiError(error: unknown, networkMessage: string): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const message = error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : networkMessage
      return new ApiError(0, message)
    }
    const payload = error.response.data as ApiErrorPayload | undefined
    return new ApiError(
      error.response.status,
      errorMessage(payload, '请求处理失败，请稍后重试'),
      payload,
    )
  }
  return new ApiError(0, error instanceof Error ? error.message : networkMessage)
}

/** 后端 API 实例：统一 /api 前缀、携带登录凭证、30s 超时 */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30_000,
})

/** 数据源等外部地址实例：无前缀、不携带凭证 */
export const externalClient = axios.create({
  timeout: 30_000,
})

let unauthorizedHandler: (() => void) | undefined

/** 注册会话失效回调（非 /auth 接口返回 401 时触发，如会话过期后跳转登录页） */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 401 &&
    !error.config?.url?.startsWith('/auth/')
  ) {
    unauthorizedHandler?.()
  }
  return Promise.reject(toApiError(error, '无法连接服务端，请确认服务已启动'))
})

externalClient.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(toApiError(error, '无法连接数据源，请检查请求地址')),
)

export async function apiRequest<ResponseBody>(
  path: string,
  schema: ZodType<ResponseBody>,
  config?: AxiosRequestConfig,
): Promise<ResponseBody> {
  const response = await apiClient.request<unknown>({ ...config, url: path })
  const result = schema.safeParse(response.data)
  if (!result.success) throw new ApiError(response.status, '服务端返回了无法识别的数据')
  return result.data
}

export async function apiNoContent(path: string, config?: AxiosRequestConfig): Promise<void> {
  await apiClient.request({ ...config, url: path })
}
