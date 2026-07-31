import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  SendEmailVerificationCodeRequest,
} from '@ai-design/contracts/auth'
import { defineStore } from 'pinia'

import { AuthApiError } from './api.ts'
import * as authApi from './api.ts'

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous' | 'unavailable'

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<AuthUser>()
  const status = ref<AuthStatus>('unknown')
  const sessionError = ref('')
  let initialization: Promise<void> | undefined

  async function initialize() {
    if (status.value === 'authenticated' || status.value === 'anonymous') return
    if (initialization) return initialization

    sessionError.value = ''
    initialization = authApi
      .getCurrentUser()
      .then((response) => {
        user.value = response.user
        status.value = 'authenticated'
      })
      .catch((error) => {
        user.value = undefined
        if (error instanceof AuthApiError && [401, 403].includes(error.status)) {
          status.value = 'anonymous'
          return
        }

        status.value = 'unavailable'
        sessionError.value =
          error instanceof Error ? error.message : '暂时无法确认登录状态，请稍后重试'
      })
      .finally(() => {
        initialization = undefined
      })

    return initialization
  }

  async function login(request: LoginRequest) {
    const response = await authApi.login(request)
    user.value = response.user
    status.value = 'authenticated'
    sessionError.value = ''
  }

  async function register(request: RegisterRequest) {
    const response = await authApi.register(request)
    user.value = response.user
    status.value = 'authenticated'
    sessionError.value = ''
  }

  function sendVerificationCode(request: SendEmailVerificationCodeRequest) {
    return authApi.sendEmailVerificationCode(request)
  }

  async function logout() {
    await authApi.logout()
    user.value = undefined
    status.value = 'anonymous'
    sessionError.value = ''
  }

  return {
    user,
    status,
    sessionError,
    initialize,
    login,
    register,
    sendVerificationCode,
    logout,
  }
})
