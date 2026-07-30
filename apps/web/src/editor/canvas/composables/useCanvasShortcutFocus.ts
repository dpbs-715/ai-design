import { useEventListener } from '@vunio/hooks'
import type { ShallowRef } from 'vue'

// vue3-sketch-ruler scopes Space panning to this viewport element.
const CANVAS_SHORTCUT_SURFACE_SELECTOR = '.canvasedit-parent'
const SPACE_ACTIVATABLE_SELECTOR = [
  'button',
  'input[type="button"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="reset"]',
  'input[type="submit"]',
  'select',
  'summary',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
].join(',')

type CanvasRootRef = Readonly<ShallowRef<HTMLDivElement | null>>

function releaseStaleControlFocus(event: PointerEvent) {
  const focusedElement = document.activeElement
  if (
    !(focusedElement instanceof HTMLElement) ||
    !focusedElement.matches(SPACE_ACTIVATABLE_SELECTOR)
  ) {
    return
  }

  const pointerTarget = event.target
  if (
    !(pointerTarget instanceof Element) ||
    !pointerTarget.closest(CANVAS_SHORTCUT_SURFACE_SELECTOR) ||
    focusedElement.contains(pointerTarget)
  ) {
    return
  }

  focusedElement.blur()
}

export function useCanvasShortcutFocus(canvasRootRef: CanvasRootRef) {
  useEventListener(canvasRootRef, 'pointermove', releaseStaleControlFocus)
}
