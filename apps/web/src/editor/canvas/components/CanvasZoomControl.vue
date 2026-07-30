<script setup lang="ts">
import RollingNumber from '@/components/RollingNumber/index.vue'

defineOptions({ name: 'CanvasZoomControl' })

interface Props {
  scale: number
  fitActive: boolean
}

type ZoomMenuCommand = number | 'center'

const { scale, fitActive } = defineProps<Props>()

const emit = defineEmits<{
  fit: []
  center: []
  zoom: [scale: number]
}>()

const zoomPresets = [
  { label: '25%', value: 0.25 },
  { label: '33%', value: 0.33 },
  { label: '50%', value: 0.5 },
  { label: '66%', value: 0.66 },
  { label: '100%', value: 1 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 },
] as const

const scalePercent = computed(() => Math.round(scale * 100))

function isScaleSelected(preset: number) {
  return Math.abs(scale - preset) < 0.005
}

function onZoomMenuCommand(command: ZoomMenuCommand) {
  if (command === 'center') {
    emit('center')
    return
  }

  emit('zoom', command)
}
</script>

<template>
  <div class="canvas-zoom-control" role="group" aria-label="画布缩放">
    <button
      type="button"
      class="canvas-zoom-control__button canvas-zoom-control__fit"
      :class="{ 'is-active': fitActive }"
      aria-label="适应画布"
      title="适应画布"
      @click="emit('fit')"
    >
      <Icon icon="mdi:fit-to-screen-outline" width="16" />
      <span v-if="fitActive" class="canvas-zoom-control__active-dot" aria-hidden="true"></span>
    </button>

    <el-dropdown
      class="canvas-zoom-control__dropdown"
      trigger="click"
      placement="top-end"
      popper-class="canvas-zoom-menu-popper"
      @command="onZoomMenuCommand"
    >
      <button
        type="button"
        class="canvas-zoom-control__button canvas-zoom-control__scale"
        aria-label="选择画布缩放比例"
      >
        <RollingNumber class="canvas-zoom-control__value" :value="scalePercent" unit="%" />
        <Icon class="canvas-zoom-control__chevron" icon="mdi:chevron-down" width="14" />
      </button>
      <template #dropdown>
        <el-dropdown-menu class="canvas-zoom-menu">
          <el-dropdown-item
            v-for="preset in zoomPresets"
            :key="preset.value"
            :command="preset.value"
            :class="{ 'is-current': isScaleSelected(preset.value) }"
          >
            <span class="canvas-zoom-menu__indicator">
              <Icon v-if="isScaleSelected(preset.value)" icon="mdi:check" width="15" />
            </span>
            <span>{{ preset.label }}</span>
          </el-dropdown-item>

          <li class="canvas-zoom-menu__separator" role="separator"></li>

          <el-dropdown-item command="center">
            <span class="canvas-zoom-menu__indicator">
              <Icon icon="mdi:target" width="15" />
            </span>
            <span>居中画布</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style lang="scss">
.canvas-zoom-control {
  display: inline-flex;
  height: 30px;
  align-items: stretch;
  border: 1px solid color-mix(in srgb, var(--border-color-strong) 84%, transparent);
  border-radius: var(--el-border-radius-base);
  background: color-mix(in srgb, var(--surface-raised) 94%, transparent);
  box-shadow: var(--el-box-shadow-lighter);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);

  .canvas-zoom-control__button {
    display: inline-flex;
    height: 28px;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    line-height: 1;
    transition:
      background-color 140ms ease,
      color 140ms ease;

    &:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    &:focus-visible {
      position: relative;
      z-index: 1;
      outline-offset: -2px;
    }
  }

  .canvas-zoom-control__fit {
    position: relative;
    width: 30px;
    flex: 0 0 30px;
    border-radius: 4px 0 0 4px;

    &.is-active {
      background: var(--accent-soft);
      color: var(--accent-color-hover);
    }
  }

  .canvas-zoom-control__active-dot {
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent-color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--surface-raised) 86%, transparent);
  }

  .canvas-zoom-control__dropdown {
    min-width: 60px;
    height: 28px;
    flex: 0 0 auto;
  }

  .canvas-zoom-control__scale {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    justify-content: flex-end;
    gap: 1px;
    padding: 0 5px 0 7px;
    border-left: 1px solid color-mix(in srgb, var(--border-color) 78%, transparent);
    border-radius: 0 4px 4px 0;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    white-space: nowrap;
  }

  .canvas-zoom-control__value {
    min-width: 0;
    flex: 1;
  }

  .canvas-zoom-control__chevron {
    flex: 0 0 auto;
    color: var(--text-muted);
  }
}

.canvas-zoom-menu-popper.el-popper {
  min-width: 132px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border-color-strong) 84%, transparent);
  border-radius: var(--el-border-radius-base);
  background: color-mix(in srgb, var(--surface-raised) 96%, transparent);
  box-shadow: var(--el-box-shadow-light);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

.canvas-zoom-menu.el-dropdown-menu {
  padding: 5px;
  background: transparent;

  .el-dropdown-menu__item {
    display: grid;
    height: 30px;
    grid-template-columns: 18px minmax(0, 1fr);
    gap: 6px;
    padding: 0 8px;
    border-radius: var(--el-border-radius-small);
    color: var(--text-secondary);
    font-size: 12px;

    &:hover,
    &:focus,
    &.is-current {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    &.is-current {
      color: var(--accent-color-hover);
    }
  }

  .canvas-zoom-menu__indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .canvas-zoom-menu__separator {
    height: 1px;
    margin: 5px 3px;
    background: var(--border-color);
    list-style: none;
  }
}
</style>
