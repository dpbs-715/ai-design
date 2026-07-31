<script setup lang="ts">
defineOptions({ name: 'AuthPanelView' })

defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <section class="auth-panel-view">
    <div class="auth-panel-view__content">
      <div class="auth-heading">
        <span>{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.auth-panel-view {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-color: color-mix(in srgb, var(--text-muted) 34%, transparent) transparent;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: color-mix(in srgb, var(--text-muted) 34%, transparent);
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.auth-panel-view__content {
  width: 100%;
}

.auth-heading {
  margin-bottom: 26px;

  span {
    color: var(--accent-color);
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
  }

  h1 {
    margin: 13px 0 10px;
    color: var(--text-primary);
    font-size: clamp(28px, 3vw, 38px);
    font-weight: 560;
    letter-spacing: -0.04em;
  }

  p {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.8;
  }
}

@media (min-width: 761px) {
  .auth-panel-view__content {
    margin-block: auto;
  }
}
</style>
