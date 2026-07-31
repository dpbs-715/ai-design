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
import { ApiError, apiNoContent, apiRequest } from '@/api/client.ts'

export { ApiError as AuthApiError }

export function sendEmailVerificationCode(
  body: SendEmailVerificationCodeRequest,
): Promise<SendEmailVerificationCodeResponse> {
  return apiRequest('/auth/email-verification-codes', sendEmailVerificationCodeResponseSchema, {
    method: 'POST',
    data: body,
  })
}

export function register(body: RegisterRequest): Promise<AuthResponse> {
  return apiRequest('/auth/register', authResponseSchema, {
    method: 'POST',
    data: body,
  })
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiRequest('/auth/login', authResponseSchema, {
    method: 'POST',
    data: body,
  })
}

export function getCurrentUser(): Promise<AuthResponse> {
  return apiRequest('/auth/me', authResponseSchema)
}

export function logout(): Promise<void> {
  return apiNoContent('/auth/logout', { method: 'POST' })
}
