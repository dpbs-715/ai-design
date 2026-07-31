import { z } from 'zod'

export const EMAIL_VERIFICATION_CODE_LENGTH = 6
export const EMAIL_VERIFICATION_CODE_TTL_SECONDS = 10 * 60
export const EMAIL_VERIFICATION_RETRY_AFTER_SECONDS = 60
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('请输入有效的邮箱地址')
  .max(254, '邮箱地址过长')

export const passwordSchema = z
  .string()
  .min(8, '密码至少需要 8 个字符')
  .max(128, '密码不能超过 128 个字符')

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, '请输入用户名称')
  .max(64, '用户名称不能超过 64 个字符')

export const emailVerificationCodeSchema = z
  .string()
  .regex(
    new RegExp(`^\\d{${EMAIL_VERIFICATION_CODE_LENGTH}}$`),
    `请输入 ${EMAIL_VERIFICATION_CODE_LENGTH} 位验证码`,
  )

export const sendEmailVerificationCodeRequestSchema = z.object({
  email: emailSchema,
})

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  verificationCode: emailVerificationCodeSchema,
})

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const authUserSchema = z.object({
  id: z.uuid(),
  email: emailSchema,
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  status: z.enum(['active', 'disabled']),
  emailVerifiedAt: z.iso.datetime().nullable(),
})

export const authResponseSchema = z.object({
  user: authUserSchema,
})

export const sendEmailVerificationCodeResponseSchema = z.object({
  expiresInSeconds: z.literal(EMAIL_VERIFICATION_CODE_TTL_SECONDS),
  retryAfterSeconds: z.literal(EMAIL_VERIFICATION_RETRY_AFTER_SECONDS),
})

export type SendEmailVerificationCodeRequest = z.infer<
  typeof sendEmailVerificationCodeRequestSchema
>
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type SendEmailVerificationCodeResponse = z.infer<
  typeof sendEmailVerificationCodeResponseSchema
>
