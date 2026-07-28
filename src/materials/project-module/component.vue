<script setup lang="ts">
import type { MaterialSchema } from '@/schema/material.ts'
import type { ProjectModuleInstanceProps } from '@/workspace/types.ts'

defineOptions({ name: 'ProjectModuleInstance' })

const { schema } = defineProps<{
  schema: MaterialSchema
}>()

const instance = computed(() => schema.props as unknown as ProjectModuleInstanceProps)
const visibleIndicators = computed(() =>
  Array.from({ length: Math.min(Math.max(instance.value.displayCount, 1), 6) }),
)
</script>

<template>
  <div class="module-instance">
    <header>
      <span>
        <Icon icon="fluent:puzzle-piece-20-filled" width="16" />
        {{ instance.title }}
      </span>
      <small>{{ instance.moduleVersion }}</small>
    </header>
    <div class="indicator-grid">
      <article v-for="(_, index) in visibleIndicators" :key="index">
        <small>指标 {{ String(index + 1).padStart(2, '0') }}</small>
        <strong>{{ 86 + index * 7 }}</strong>
        <i></i>
      </article>
    </div>
    <footer>
      <span>公共模块实例</span>
      <span>{{ instance.displayCount }} 项展示</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.module-instance {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--render-theme-border, var(--border-color));
  border-radius: 10px;
  background: var(--render-theme-container-background, var(--surface-panel));
  color: var(--render-theme-text-primary, var(--text-primary));
}

header,
footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
}

header {
  height: 44px;
  padding: 0 15px;
  border-bottom: 1px dashed var(--render-theme-border, var(--border-color));

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
  }

  small {
    padding: 3px 6px;
    border-radius: 99px;
    background: color-mix(
      in srgb,
      var(--render-theme-primary, var(--accent-color)) 14%,
      transparent
    );
    color: var(--render-theme-primary, var(--accent-color));
    font-size: 9px;
  }
}

.indicator-grid {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  padding: 12px;
}

article {
  position: relative;
  display: flex;
  min-width: 0;
  justify-content: center;
  flex-direction: column;
  padding: 10px;
  overflow: hidden;
  border: 1px solid var(--render-theme-border, var(--border-color));
  border-radius: 7px;
  background: color-mix(
    in srgb,
    var(--render-theme-container-background, var(--surface-raised)) 76%,
    transparent
  );

  small {
    color: var(--render-theme-text-muted, var(--text-muted));
    font-size: 9px;
  }

  strong {
    margin-top: 6px;
    font-size: 18px;
    font-weight: 650;
  }

  i {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 42%;
    height: 2px;
    background: var(--render-theme-primary, var(--accent-color));
  }
}

footer {
  height: 32px;
  padding: 0 15px;
  border-top: 1px solid var(--render-theme-border, var(--border-color));
  color: var(--render-theme-text-muted, var(--text-muted));
  font-size: 8px;
}
</style>
