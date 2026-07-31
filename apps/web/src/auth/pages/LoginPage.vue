<script setup lang="ts">
import { loginRequestSchema } from '@ai-design/contracts/auth'
import type { LoginRequest } from '@ai-design/contracts/auth'
import { useConfigs } from '@vunio/hooks'
import type { CommonFormConfig } from '@vunio/ui'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import AuthFeedback from '../components/AuthFeedback.vue'
import AuthPanelView from '../components/AuthPanelView.vue'
import { resolveAuthRedirect } from '../navigation.ts'
import { useAuthStore } from '../store.ts'

defineOptions({ name: 'LoginPage' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { sessionError, status } = storeToRefs(authStore)
const draft = ref<LoginRequest>({
  email: '',
  password: '',
})
const isSubmitting = ref(false)
const formError = ref('')
const feedbackMessage = computed(() => {
  if (formError.value) return formError.value
  return status.value === 'unavailable' ? sessionError.value : ''
})

const { config } = useConfigs<CommonFormConfig>([
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
    label: '密码',
    field: 'password',
    component: 'input',
    span: 24,
    props: {
      type: 'password',
      autocomplete: 'current-password',
      placeholder: '输入登录密码',
      showPassword: true,
    },
  },
])

async function submit() {
  if (isSubmitting.value) return

  const result = loginRequestSchema.safeParse(draft.value)
  if (!result.success) {
    formError.value = result.error.issues[0]?.message ?? '请检查登录信息'
    return
  }

  formError.value = ''
  isSubmitting.value = true

  try {
    await authStore.login(result.data)
    await router.replace(resolveAuthRedirect(route.query.redirect))
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '登录失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthPanelView
    eyebrow="WORKSPACE ACCESS"
    title="欢迎回来"
    description="登录后继续编辑、预览和管理你的可视化项目。"
  >
    <form class="auth-form" novalidate @submit.prevent="submit">
      <CommonForm
        v-model="draft"
        :config="config"
        :col="{ sm: 24, md: 24, lg: 24, xl: 24 }"
        label-position="top"
        size="large"
      />

      <AuthFeedback :message="feedbackMessage" />

      <CommonButton
        class="auth-submit"
        type="primary"
        size="large"
        :loading="isSubmitting"
        @click="submit"
      >
        <span>进入工作区</span>
        <Icon icon="fluent:arrow-right-20-regular" width="17" />
      </CommonButton>

      <p class="auth-switch">
        还没有账户？
        <RouterLink :to="{ name: 'Register', query: route.query }">创建账户</RouterLink>
      </p>
    </form>
  </AuthPanelView>
</template>

<style scoped lang="scss">
.auth-form {
  width: 100%;
}

:deep(.commonForm .el-form-item) {
  margin-bottom: 22px;
}

:deep(.commonForm .el-form-item__label) {
  height: auto;
  margin-bottom: 7px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

:deep(.commonForm .el-input__wrapper) {
  min-height: 44px;
  border-radius: 3px;
  transition:
    box-shadow 180ms ease,
    background-color 180ms ease;
}

:deep(.commonForm .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--accent-color) inset,
    0 8px 24px color-mix(in srgb, var(--accent-color) 8%, transparent);
}

.auth-submit {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 9px;

  :deep(svg) {
    transition: transform 180ms ease;
  }

  &:hover :deep(svg) {
    transform: translateX(3px);
  }
}

.auth-switch {
  margin: 24px 0 0;
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
</style>
