<script setup lang="ts">
defineOptions({ name: 'AuthFeedback' })

defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="auth-feedback" aria-live="polite">
    <p v-if="message" role="alert">
      <Icon icon="fluent:error-circle-20-regular" width="16" />
      <span>{{ message }}</span>
    </p>
  </div>
</template>

<style scoped lang="scss">
.auth-feedback {
  display: flex;
  min-height: 36px;
  align-items: flex-start;
  padding-top: 2px;
}

p {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 0;
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 18px;
}

svg {
  flex: none;
  margin-top: 1px;
}
</style>
