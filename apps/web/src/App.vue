<script setup lang="ts">
import SchemaLoadingState from '@/components/SchemaLoadingState.vue'
import {
  clearRouteNavigationError,
  isRouteNavigationPending,
  routeNavigationErrorMessage,
} from '@/router/navigationState.ts'

function reloadPage() {
  window.location.reload()
}
</script>

<template>
  <router-view />
  <Teleport to="body">
    <Transition name="route-loading">
      <div v-if="isRouteNavigationPending" class="route-loading-overlay">
        <SchemaLoadingState title="正在加载页面" description="正在获取页面资源并准备界面，请稍候" />
      </div>
    </Transition>
    <Transition name="route-loading">
      <section v-if="routeNavigationErrorMessage" class="route-loading-error" role="alert">
        <div>
          <strong>页面加载失败</strong>
          <p>{{ routeNavigationErrorMessage }}</p>
        </div>
        <div class="route-loading-error__actions">
          <button type="button" @click="clearRouteNavigationError">留在当前页面</button>
          <button type="button" class="is-primary" @click="reloadPage">刷新重试</button>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.route-loading-overlay {
  position: fixed;
  z-index: 4000;
  inset: 0;
  overflow: auto;
}

.route-loading-error {
  position: fixed;
  z-index: 4100;
  top: 24px;
  left: 50%;
  display: flex;
  width: min(560px, calc(100vw - 32px));
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 18px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--surface-raised);
  box-shadow: 0 14px 36px rgb(0 0 0 / 18%);
  color: var(--text-primary);
  transform: translateX(-50%);

  strong {
    font-size: 14px;
  }

  p {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }

  button {
    padding: 7px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      border-color: var(--border-color-strong);
      color: var(--text-primary);
    }

    &.is-primary {
      border-color: var(--accent-color);
      background: var(--accent-color);
      color: #fff;
    }
  }
}

.route-loading-error__actions {
  display: flex;
  flex: none;
  gap: 8px;
}

.route-loading-enter-active,
.route-loading-leave-active {
  transition: opacity 140ms ease;
}

.route-loading-enter-from,
.route-loading-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .route-loading-enter-active,
  .route-loading-leave-active {
    transition: none;
  }
}

@media (width <= 600px) {
  .route-loading-error {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .route-loading-error__actions {
    justify-content: flex-end;
  }
}
</style>
