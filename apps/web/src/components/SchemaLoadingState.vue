<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: '正在加载 Schema',
    description: '正在校验配置并准备渲染内容',
  },
)
</script>

<template>
  <section class="schema-loading" role="status" aria-live="polite">
    <div class="schema-loading__preview" aria-hidden="true">
      <div class="schema-loading__topbar">
        <span></span>
        <span></span>
        <span></span>
        <i></i>
      </div>
      <div class="schema-loading__body">
        <aside>
          <i></i>
          <i></i>
          <i></i>
        </aside>
        <div class="schema-loading__canvas">
          <span class="schema-loading__block schema-loading__block--wide"></span>
          <span class="schema-loading__block"></span>
          <span class="schema-loading__block schema-loading__block--short"></span>
        </div>
        <aside>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </aside>
      </div>
      <div class="schema-loading__scan"></div>
    </div>

    <div class="schema-loading__copy">
      <span class="schema-loading__spinner" aria-hidden="true"></span>
      <div>
        <strong>{{ title }}</strong>
        <p>{{ description }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.schema-loading {
  display: flex;
  width: 100%;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 32px;
  background:
    radial-gradient(circle at 50% 42%, var(--accent-soft), transparent 34%),
    var(--surface-workbench);
  color: var(--text-primary);
}

.schema-loading__preview {
  position: relative;
  width: min(420px, 78vw);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--surface-panel);
  box-shadow: 0 20px 60px color-mix(in srgb, #000 18%, transparent);
}

.schema-loading__topbar {
  display: flex;
  height: 28px;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  border-bottom: 1px solid var(--border-color);

  span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--border-color-strong);
  }

  i {
    width: 64px;
    height: 5px;
    margin: 0 auto;
    border-radius: 99px;
    background: var(--surface-raised);
  }
}

.schema-loading__body {
  display: grid;
  height: calc(100% - 28px);
  grid-template-columns: 68px 1fr 78px;

  aside {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 14px 10px;
    border-right: 1px solid var(--border-color);

    &:last-child {
      border-right: 0;
      border-left: 1px solid var(--border-color);
    }

    i {
      height: 6px;
      border-radius: 99px;
      background: var(--surface-raised);
    }
  }
}

.schema-loading__canvas {
  position: relative;
  margin: 18px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background: color-mix(in srgb, var(--surface-workbench) 78%, var(--surface-panel));
}

.schema-loading__block {
  position: absolute;
  top: 24%;
  left: 10%;
  width: 27%;
  height: 43%;
  border-radius: 3px;
  background: var(--accent-soft);

  &--wide {
    top: 15%;
    right: 10%;
    left: auto;
    width: 44%;
    height: 18%;
  }

  &--short {
    top: 43%;
    right: 15%;
    left: auto;
    width: 34%;
    height: 33%;
  }
}

.schema-loading__scan {
  position: absolute;
  inset: 28px 0 auto;
  height: 42%;
  transform: translateY(-100%);
  background: linear-gradient(180deg, transparent, var(--accent-soft), transparent);
  animation: schema-scan 1.8s ease-in-out infinite;
}

.schema-loading__copy {
  display: flex;
  align-items: center;
  gap: 12px;

  strong {
    display: block;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 4px 0 0;
    color: var(--text-muted);
    font-size: 11px;
  }
}

.schema-loading__spinner {
  width: 22px;
  height: 22px;
  flex: none;
  border: 2px solid var(--accent-soft-hover);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: schema-spin 800ms linear infinite;
}

@keyframes schema-scan {
  0% {
    transform: translateY(-100%);
  }

  100% {
    transform: translateY(240%);
  }
}

@keyframes schema-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .schema-loading__scan,
  .schema-loading__spinner {
    animation: none;
  }
}

@media (max-width: 520px) {
  .schema-loading {
    padding: 20px;
  }

  .schema-loading__body {
    grid-template-columns: 46px 1fr 52px;
  }

  .schema-loading__canvas {
    margin: 12px;
  }
}
</style>
