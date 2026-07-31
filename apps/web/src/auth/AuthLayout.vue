<script setup lang="ts">
import { onBeforeUnmount } from 'vue'

import AuthShell from './components/AuthShell.vue'

defineOptions({ name: 'AuthLayout' })

type AnimationHandle = {
  kill: () => void
}

const PANEL_CONTENT_SELECTOR = '.auth-panel-view__content'
const PANEL_ITEM_SELECTOR = [
  '.auth-heading > *',
  '.commonForm .el-form-item',
  '.auth-feedback',
  '.auth-submit',
  '.auth-switch',
].join(', ')
const ENTER_OFFSET_X = 24
const LEAVE_OFFSET_X = -12
const ENTER_CONTENT_DURATION_SECONDS = 0.38
const ENTER_ITEM_DURATION_SECONDS = 0.26
const ENTER_ITEM_DELAY_SECONDS = 0.045
const ENTER_ITEM_STAGGER_SECONDS = 0.024
const LEAVE_DURATION_SECONDS = 0.18
const activeAnimations = new Map<HTMLElement, AnimationHandle>()
const panelTransitionTokens = new WeakMap<HTMLElement, symbol>()
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const gsapModulePromise = import('gsap')
let unmounted = false

function asPanel(element: Element) {
  return element as HTMLElement
}

function stopPanelAnimation(panel: HTMLElement) {
  activeAnimations.get(panel)?.kill()
  activeAnimations.delete(panel)
}

function beginPanelTransition(panel: HTMLElement) {
  const token = Symbol()
  panelTransitionTokens.set(panel, token)
  return token
}

function getPanelAnimationTargets(panel: HTMLElement) {
  const content = panel.querySelector<HTMLElement>(PANEL_CONTENT_SELECTOR) ?? panel
  const items = Array.from(content.querySelectorAll<HTMLElement>(PANEL_ITEM_SELECTOR))

  return { content, items }
}

function clearAnimatedElementStyles(element: HTMLElement) {
  element.style.removeProperty('opacity')
  element.style.removeProperty('rotate')
  element.style.removeProperty('scale')
  element.style.removeProperty('transform')
  element.style.removeProperty('translate')
  element.style.removeProperty('visibility')
  element.style.removeProperty('will-change')
}

function clearPanelAnimationStyles(panel: HTMLElement) {
  const { content, items } = getPanelAnimationTargets(panel)

  panel.style.removeProperty('opacity')
  panel.style.removeProperty('pointer-events')
  panel.style.removeProperty('transform')
  panel.style.removeProperty('visibility')
  panel.style.removeProperty('z-index')
  clearAnimatedElementStyles(content)
  items.forEach(clearAnimatedElementStyles)
}

function finishPanelAnimation(
  panel: HTMLElement,
  token: symbol,
  animation: AnimationHandle,
  done: () => void,
) {
  if (panelTransitionTokens.get(panel) !== token || activeAnimations.get(panel) !== animation) {
    return
  }

  panelTransitionTokens.delete(panel)
  activeAnimations.delete(panel)
  done()
  clearPanelAnimationStyles(panel)
}

function preparePanelEnter(element: Element) {
  const panel = asPanel(element)
  stopPanelAnimation(panel)
  clearPanelAnimationStyles(panel)
  beginPanelTransition(panel)
  panel.style.zIndex = '2'

  if (prefersReducedMotion) return

  const { content, items } = getPanelAnimationTargets(panel)
  content.style.opacity = '0'
  content.style.visibility = 'hidden'
  content.style.transform = `translate3d(${ENTER_OFFSET_X}px, 0, 0)`
  content.style.willChange = 'opacity, transform'

  items.forEach((item) => {
    item.style.opacity = '0'
    item.style.transform = 'translate3d(0, 10px, 0)'
    item.style.willChange = 'opacity, transform'
  })
}

async function enterPanel(element: Element, done: () => void) {
  const panel = asPanel(element)
  const token = panelTransitionTokens.get(panel) ?? beginPanelTransition(panel)
  if (prefersReducedMotion) {
    panelTransitionTokens.delete(panel)
    clearPanelAnimationStyles(panel)
    done()
    return
  }

  try {
    const { gsap } = await gsapModulePromise
    if (unmounted || !panel.isConnected || panelTransitionTokens.get(panel) !== token) {
      return
    }

    stopPanelAnimation(panel)
    const { content, items } = getPanelAnimationTargets(panel)
    const animation = gsap.timeline({
      onComplete: () => finishPanelAnimation(panel, token, animation, done),
    })

    animation.to(
      content,
      {
        autoAlpha: 1,
        x: 0,
        duration: ENTER_CONTENT_DURATION_SECONDS,
        ease: 'power3.out',
        overwrite: true,
      },
      0,
    )

    if (items.length > 0) {
      animation.to(
        items,
        {
          opacity: 1,
          y: 0,
          duration: ENTER_ITEM_DURATION_SECONDS,
          ease: 'power2.out',
          stagger: ENTER_ITEM_STAGGER_SECONDS,
          overwrite: true,
        },
        ENTER_ITEM_DELAY_SECONDS,
      )
    }

    activeAnimations.set(panel, animation)
  } catch {
    if (panelTransitionTokens.get(panel) !== token) return

    panelTransitionTokens.delete(panel)
    clearPanelAnimationStyles(panel)
    done()
  }
}

async function leavePanel(element: Element, done: () => void) {
  const panel = asPanel(element)
  stopPanelAnimation(panel)
  clearPanelAnimationStyles(panel)
  const token = beginPanelTransition(panel)
  panel.style.pointerEvents = 'none'
  panel.style.zIndex = '1'

  if (prefersReducedMotion) {
    panelTransitionTokens.delete(panel)
    clearPanelAnimationStyles(panel)
    done()
    return
  }

  try {
    const { gsap } = await gsapModulePromise
    if (unmounted || !panel.isConnected || panelTransitionTokens.get(panel) !== token) {
      return
    }

    const { content } = getPanelAnimationTargets(panel)
    content.style.willChange = 'opacity, transform'
    const animation = gsap.timeline({
      onComplete: () => finishPanelAnimation(panel, token, animation, done),
    })

    animation.to(content, {
      autoAlpha: 0,
      x: LEAVE_OFFSET_X,
      duration: LEAVE_DURATION_SECONDS,
      ease: 'power2.in',
      overwrite: true,
    })

    activeAnimations.set(panel, animation)
  } catch {
    if (panelTransitionTokens.get(panel) !== token) return

    panelTransitionTokens.delete(panel)
    clearPanelAnimationStyles(panel)
    done()
  }
}

function cancelPanelAnimation(element: Element) {
  const panel = asPanel(element)
  panelTransitionTokens.delete(panel)
  stopPanelAnimation(panel)
  clearPanelAnimationStyles(panel)
}

onBeforeUnmount(() => {
  unmounted = true
  activeAnimations.forEach((animation) => animation.kill())
  activeAnimations.clear()
})
</script>

<template>
  <AuthShell>
    <div class="auth-panel-router">
      <RouterView v-slot="{ Component, route }">
        <Transition
          :css="false"
          appear
          @before-enter="preparePanelEnter"
          @enter="enterPanel"
          @leave="leavePanel"
          @enter-cancelled="cancelPanelAnimation"
          @leave-cancelled="cancelPanelAnimation"
        >
          <component
            :is="Component"
            :key="String(route.name ?? route.path)"
            class="auth-panel-route"
          />
        </Transition>
      </RouterView>
    </div>
  </AuthShell>
</template>

<style scoped lang="scss">
.auth-panel-router {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  :deep(.auth-panel-route) {
    position: absolute;
    inset: 0;
    min-width: 0;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-panel-router {
    :deep(.auth-panel-route),
    :deep(.auth-panel-view__content) {
      will-change: auto;
    }
  }
}
</style>
