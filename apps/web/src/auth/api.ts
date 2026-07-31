import {
  authResponseSchema,
  sendEmailVerificationCodeResponseSchema,
} from '@ai-design/contracts/auth'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SendEmailVerificationCodeRequest,
  SendEmailVerificationCodeResponse,
} from '@ai-design/contracts/auth'
import type { ZodType } from 'zod'

interface ApiErrorPayload {
  message?: string | string[]
  issues?: Array<{ message?: string }>
}

export class AuthApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AuthApiError'
  }
}

function errorMessage(payload: ApiErrorPayload | undefined, fallback: string) {
  const issueMessage = payload?.issues?.find((issue) => issue.message)?.message
  if (issueMessage) return issueMessage

  if (Array.isArray(payload?.message)) {
    return payload.message[0] ?? fallback
  }

  return payload?.message ?? fallback
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) return undefined
  return response.json()
}

async function request<ResponseBody>(
  path: string,
  schema: ZodType<ResponseBody>,
  options?: RequestInit,
): Promise<ResponseBody> {
  let response: Response

  try {
    response = await fetch(`/api/auth${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
  } catch {
    throw new AuthApiError(0, '无法连接服务端，请确认服务已启动')
  }

  const payload = await parseJson(response)
  if (!response.ok) {
    throw new AuthApiError(
      response.status,
      errorMessage(payload as ApiErrorPayload | undefined, '请求处理失败，请稍后重试'),
    )
  }

  const result = schema.safeParse(payload)
  if (!result.success) {
    throw new AuthApiError(response.status, '服务端返回了无法识别的数据')
  }

  return result.data
}

export function sendEmailVerificationCode(
  body: SendEmailVerificationCodeRequest,
): Promise<SendEmailVerificationCodeResponse> {
  return request('/email-verification-codes', sendEmailVerificationCodeResponseSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function register(body: RegisterRequest): Promise<AuthResponse> {
  return request('/register', authResponseSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return request('/login', authResponseSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getCurrentUser(): Promise<AuthResponse> {
  return request('/me', authResponseSchema)
}

export async function logout(): Promise<void> {
  let response: Response

  try {
    response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    throw new AuthApiError(0, '无法连接服务端，请稍后重试')
  }

  if (!response.ok) {
    const payload = (await parseJson(response)) as ApiErrorPayload | undefined
    throw new AuthApiError(response.status, errorMessage(payload, '退出失败，请稍后重试'))
  }
}
