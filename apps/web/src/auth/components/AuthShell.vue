<script setup lang="ts">
import EditorAccentControl from '@/editor/theme/EditorAccentControl.vue'
import EditorThemeControl from '@/editor/theme/EditorThemeControl.vue'
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

defineOptions({ name: 'AuthShell' })

const shell = useTemplateRef<HTMLElement>('shell')
let animationContext: { revert: () => void } | undefined
let unmounted = false

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  if (unmounted || !shell.value) return

  animationContext = gsap.context(() => {
    const timeline = gsap.timeline({
      defaults: { duration: 0.68, ease: 'power3.out' },
    })

    timeline
      .from('.auth-header', { autoAlpha: 0, y: -12, duration: 0.5 })
      .from('.canvas-board', { autoAlpha: 0, scale: 0.96, y: 16 }, '-=0.2')
      .from('.selection-frame', { autoAlpha: 0, scale: 0.9, duration: 0.52 }, '-=0.4')
      .from('.signal-card--primary', { autoAlpha: 0, x: -12, duration: 0.45 }, '-=0.3')
  }, shell.value)
})

onBeforeUnmount(() => {
  unmounted = true
  animationContext?.revert()
})
</script>

<template>
  <main ref="shell" class="auth-shell">
    <header class="auth-header">
      <RouterLink class="auth-brand" to="/" aria-label="视界工场">
        <img src="/favicon.svg" alt="" />
        <span>
          <strong>视界工场</strong>
          <small>VISUAL WORKS</small>
        </span>
      </RouterLink>

      <div class="auth-appearance" aria-label="系统外观设置">
        <EditorThemeControl />
        <EditorAccentControl />
      </div>
    </header>

    <section class="auth-stage">
      <div class="canvas-showcase" aria-hidden="true">
        <div class="canvas-ruler canvas-ruler--horizontal">
          <span v-for="tick in 8" :key="tick">{{ (tick - 1) * 160 }}</span>
        </div>
        <div class="canvas-ruler canvas-ruler--vertical">
          <span v-for="tick in 6" :key="tick">{{ (tick - 1) * 120 }}</span>
        </div>

        <div class="canvas-board">
          <span class="crop-mark crop-mark--tl"></span>
          <span class="crop-mark crop-mark--tr"></span>
          <span class="crop-mark crop-mark--bl"></span>
          <span class="crop-mark crop-mark--br"></span>

          <div class="canvas-board__meta">
            <span>ARTBOARD / 01</span>
            <strong>1920 × 1080</strong>
          </div>

          <div class="signal-card signal-card--primary">
            <small>LIVE CANVAS</small>
            <strong>把数据组织成<br />清晰的视觉叙事</strong>
            <span>DESIGN · PREVIEW · PUBLISH</span>
          </div>

          <div class="signal-card signal-card--secondary">
            <span>COMPONENTS</span>
            <strong>24</strong>
            <i></i>
          </div>

          <div class="selection-frame">
            <i v-for="handle in 8" :key="handle"></i>
          </div>

          <div class="canvas-coordinate">X 0840<br />Y 0368</div>
        </div>
      </div>

      <div class="auth-panel">
        <div class="auth-panel__content">
          <slot />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.auth-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 620px;
  overflow: auto;
  background:
    linear-gradient(var(--border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-color) 1px, transparent 1px), var(--surface-workbench);
  background-position: -1px -1px;
  background-size: 32px 32px;
}

.auth-header {
  position: sticky;
  z-index: 10;
  top: 0;
  display: flex;
  height: 68px;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--surface-workbench) 88%, transparent);
  backdrop-filter: blur(18px);
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--text-primary);
  text-decoration: none;

  img {
    width: 31px;
    height: 31px;
  }

  span {
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: 15px;
    font-weight: 650;
    letter-spacing: 0.08em;
  }

  small {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.2em;
  }
}

.auth-appearance {
  display: flex;
  align-items: center;
  gap: 6px;
}

.auth-stage {
  display: grid;
  min-height: calc(100% - 68px);
  grid-template-columns: minmax(440px, 1.15fr) minmax(400px, 0.85fr);
}

.canvas-showcase {
  position: relative;
  display: grid;
  min-height: 620px;
  place-items: center;
  padding: 74px 72px 88px 96px;
  overflow: hidden;
  border-right: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--surface-workbench) 82%, transparent);
}

.canvas-ruler {
  position: absolute;
  display: flex;
  color: var(--text-muted);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;

  span {
    position: relative;

    &::before {
      position: absolute;
      background: var(--border-color-strong);
      content: '';
    }
  }
}

.canvas-ruler--horizontal {
  top: 30px;
  right: 54px;
  left: 54px;
  justify-content: space-between;

  span::before {
    top: 17px;
    left: 50%;
    width: 1px;
    height: 6px;
  }
}

.canvas-ruler--vertical {
  top: 72px;
  bottom: 72px;
  left: 29px;
  flex-direction: column;
  justify-content: space-between;

  span {
    writing-mode: vertical-rl;

    &::before {
      top: 50%;
      left: 17px;
      width: 6px;
      height: 1px;
    }
  }
}

.canvas-board {
  position: relative;
  width: min(100%, 720px);
  aspect-ratio: 16 / 10;
  border: 1px solid var(--border-color-strong);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--surface-panel) 96%, transparent),
    var(--surface-raised)
  );
  box-shadow: 0 32px 80px rgb(0 0 0 / 18%);
}

.canvas-board::before {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(color-mix(in srgb, var(--border-color) 70%, transparent) 1px, transparent 1px),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--border-color) 70%, transparent) 1px,
      transparent 1px
    );
  background-size: 12.5% 20%;
  content: '';
  mask-image: linear-gradient(to bottom right, black, transparent 78%);
}

.canvas-board__meta {
  position: absolute;
  top: 20px;
  right: 22px;
  left: 22px;
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.12em;

  strong {
    color: var(--text-secondary);
    font-size: inherit;
    font-weight: 500;
  }
}

.signal-card {
  position: absolute;
  border: 1px solid var(--border-color-strong);
  background: var(--surface-panel);
}

.signal-card--primary {
  top: 22%;
  left: 12%;
  width: 55%;
  padding: clamp(20px, 3vw, 38px);

  small {
    color: var(--accent-color);
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 8px;
    letter-spacing: 0.18em;
  }

  strong {
    display: block;
    margin-top: 18px;
    color: var(--text-primary);
    font-size: clamp(20px, 2.2vw, 34px);
    font-weight: 520;
    letter-spacing: -0.04em;
    line-height: 1.32;
  }

  span {
    display: block;
    margin-top: 26px;
    color: var(--text-muted);
    font-size: 8px;
    letter-spacing: 0.16em;
  }
}

.signal-card--secondary {
  right: 8%;
  bottom: 13%;
  width: 28%;
  padding: 16px;

  span {
    color: var(--text-muted);
    font-size: 8px;
    letter-spacing: 0.14em;
  }

  strong {
    display: block;
    margin-top: 8px;
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: clamp(24px, 3vw, 42px);
    font-weight: 400;
  }

  i {
    display: block;
    width: 62%;
    height: 2px;
    margin-top: 12px;
    background: var(--accent-color);
  }
}

.selection-frame {
  position: absolute;
  top: 16%;
  left: 8%;
  width: 64%;
  height: 66%;
  border: 1px solid var(--accent-color);
  pointer-events: none;

  i {
    position: absolute;
    width: 6px;
    height: 6px;
    border: 1px solid var(--accent-color);
    background: var(--surface-panel);

    &:nth-child(1) {
      top: -4px;
      left: -4px;
    }

    &:nth-child(2) {
      top: -4px;
      left: calc(50% - 3px);
    }

    &:nth-child(3) {
      top: -4px;
      right: -4px;
    }

    &:nth-child(4) {
      top: calc(50% - 3px);
      right: -4px;
    }

    &:nth-child(5) {
      right: -4px;
      bottom: -4px;
    }

    &:nth-child(6) {
      bottom: -4px;
      left: calc(50% - 3px);
    }

    &:nth-child(7) {
      bottom: -4px;
      left: -4px;
    }

    &:nth-child(8) {
      top: calc(50% - 3px);
      left: -4px;
    }
  }
}

.canvas-coordinate {
  position: absolute;
  right: 22px;
  bottom: 20px;
  color: var(--text-muted);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  line-height: 1.7;
  text-align: right;
}

.crop-mark {
  position: absolute;
  z-index: 2;
  width: 13px;
  height: 13px;

  &::before,
  &::after {
    position: absolute;
    background: var(--text-muted);
    content: '';
  }

  &::before {
    width: 13px;
    height: 1px;
  }

  &::after {
    width: 1px;
    height: 13px;
  }
}

.crop-mark--tl {
  top: -7px;
  left: -7px;
}

.crop-mark--tr {
  top: -7px;
  right: -7px;
  transform: rotate(90deg);
}

.crop-mark--bl {
  bottom: -7px;
  left: -7px;
  transform: rotate(-90deg);
}

.crop-mark--br {
  right: -7px;
  bottom: -7px;
  transform: rotate(180deg);
}

.auth-panel {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: clamp(24px, 4vh, 48px) clamp(32px, 6vw, 96px);
  background: color-mix(in srgb, var(--surface-panel) 94%, transparent);
}

.auth-panel__content {
  position: relative;
  width: min(100%, 420px);
  min-height: 0;
}

@media (max-width: 980px) {
  .auth-stage {
    grid-template-columns: minmax(320px, 0.8fr) minmax(400px, 1fr);
  }

  .canvas-showcase {
    padding: 60px 34px 84px 52px;
  }
}

@media (max-width: 760px) {
  .auth-shell {
    min-height: 100%;
    overflow-y: auto;
  }

  .auth-header {
    padding: 0 18px;
  }

  .auth-stage {
    display: block;
    min-height: calc(100% - 68px);
  }

  .canvas-showcase {
    display: none;
  }

  .auth-panel {
    min-height: calc(100vh - 68px);
    padding: clamp(24px, 4vh, 36px) 22px clamp(32px, 6vh, 48px);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
