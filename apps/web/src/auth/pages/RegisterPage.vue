<script setup lang="ts">
import {
  registerRequestSchema,
  sendEmailVerificationCodeRequestSchema,
} from '@ai-design/contracts/auth'
import type { RegisterRequest } from '@ai-design/contracts/auth'
import { useConfigs } from '@vunio/hooks'
import type { CommonFormConfig } from '@vunio/ui'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import AuthFeedback from '../components/AuthFeedback.vue'
import AuthPanelView from '../components/AuthPanelView.vue'
import { resolveAuthRedirect } from '../navigation.ts'
import { useAuthStore } from '../store.ts'

defineOptions({ name: 'RegisterPage' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const draft = ref<RegisterRequest>({
  displayName: '',
  email: '',
  verificationCode: '',
  password: '',
})
const isSubmitting = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)
const formError = ref('')
let countdownTimer: number | undefined

const { config } = useConfigs<CommonFormConfig>([
  {
    label: '用户名称',
    field: 'displayName',
    component: 'input',
    span: 24,
    props: {
      autocomplete: 'name',
      maxlength: 64,
      placeholder: '工作区内显示的名称',
      clearable: true,
    },
  },
  {
    label: '邮箱',
    field: 'email',
    component: 'input',
    span: 24,
    props: {
      type: 'email',
      autocomplete: 'email',
      placeholder: 'name@example.com',
      clearable: true,
    },
  },
  {
    label: '邮箱验证码',
    field: 'verificationCode',
    component: 'input',
    span: 24,
  },
  {
    label: '密码',
    field: 'password',
    component: 'input',
    span: 24,
    props: {
      type: 'password',
      autocomplete: 'new-password',
      placeholder: '至少 8 个字符',
      showPassword: true,
    },
  },
])

function startCountdown(seconds: number) {
  if (countdownTimer !== undefined) window.clearInterval(countdownTimer)
  countdown.value = seconds
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && countdownTimer !== undefined) {
      window.clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }, 1000)
}

async function sendCode() {
  if (isSendingCode.value || countdown.value > 0) return

  const result = sendEmailVerificationCodeRequestSchema.safeParse({ email: draft.value.email })
  if (!result.success) {
    formError.value = result.error.issues[0]?.message ?? '请检查邮箱地址'
    return
  }

  formError.value = ''
  isSendingCode.value = true

  try {
    const response = await authStore.sendVerificationCode(result.data)
    startCountdown(response.retryAfterSeconds)
    ElMessage.success('验证码已发送，请在 10 分钟内使用')
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '验证码发送失败'
  } finally {
    isSendingCode.value = false
  }
}

async function submit() {
  if (isSubmitting.value) return

  const result = registerRequestSchema.safeParse(draft.value)
  if (!result.success) {
    formError.value = result.error.issues[0]?.message ?? '请检查注册信息'
    return
  }

  formError.value = ''
  isSubmitting.value = true

  try {
    await authStore.register(result.data)
    await router.replace(resolveAuthRedirect(route.query.redirect))
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '注册失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  if (countdownTimer !== undefined) window.clearInterval(countdownTimer)
})
</script>

<template>
  <AuthPanelView
    eyebrow="CREATE WORKSPACE"
    title="创建你的账户"
    description="使用邮箱完成验证，系统会同时为你建立默认设计工作区。"
  >
    <form class="auth-form" novalidate @submit.prevent="submit">
      <CommonForm
        v-model="draft"
        :config="config"
        :col="{ sm: 24, md: 24, lg: 24, xl: 24 }"
        label-position="top"
        size="large"
      >
        <template #verificationCode="{ modelValue, updateModelValue }">
          <div class="verification-control">
            <el-input
              :model-value="String(modelValue ?? '')"
              autocomplete="one-time-code"
              inputmode="numeric"
              maxlength="6"
              placeholder="6 位数字验证码"
              @update:model-value="updateModelValue"
            />
            <CommonButton
              type="normal"
              size="large"
              :disabled="countdown > 0"
              :loading="isSendingCode"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </CommonButton>
          </div>
        </template>
      </CommonForm>

      <AuthFeedback :message="formError" />

      <CommonButton
        class="auth-submit"
        type="primary"
        size="large"
        :loading="isSubmitting"
        @click="submit"
      >
        创建并进入工作区
      </CommonButton>

      <p class="auth-switch">
        已有账户？
        <RouterLink :to="{ name: 'Login', query: route.query }">直接登录</RouterLink>
      </p>
    </form>
  </AuthPanelView>
</template>

<style scoped lang="scss">
.auth-form {
  width: 100%;
}

:deep(.commonForm .el-form-item) {
  margin-bottom: 14px;
}

:deep(.commonForm .el-form-item__label) {
  height: auto;
  margin-bottom: 7px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

:deep(.commonForm .el-input__wrapper) {
  min-height: 42px;
}

.verification-control {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) 118px;
  gap: 10px;

  :deep(.CommonButton) {
    height: 42px;
  }
}

.auth-submit {
  width: 100%;
  min-height: 44px;
  margin-top: 2px;
}

.auth-switch {
  margin: 18px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;

  a {
    margin-left: 4px;
    color: var(--text-primary);
    font-weight: 600;
    text-decoration: none;

    &:hover {
      color: var(--accent-color);
    }
  }
}

@media (max-width: 390px) {
  .verification-control {
    grid-template-columns: 1fr;
  }
}
</style>
