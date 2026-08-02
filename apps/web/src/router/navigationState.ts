import { readonly, ref } from 'vue'

const pending = ref(false)
const errorMessage = ref('')
const navigationTokens = new WeakMap<object, symbol>()
let activeToken: symbol | undefined

export const isRouteNavigationPending = readonly(pending)
export const routeNavigationErrorMessage = readonly(errorMessage)

export function beginRouteNavigation(navigation: object) {
  const token = Symbol('route-navigation')
  navigationTokens.set(navigation, token)
  activeToken = token
  pending.value = true
  errorMessage.value = ''
}

export function finishRouteNavigation(navigation: object) {
  resolveRouteNavigation(navigation)
}

export function failRouteNavigation(navigation: object) {
  if (!resolveRouteNavigation(navigation)) return
  errorMessage.value = '页面资源加载失败，可能是网络中断或应用版本已更新。'
}

export function clearRouteNavigationError() {
  errorMessage.value = ''
}

function resolveRouteNavigation(navigation: object) {
  const token = navigationTokens.get(navigation)
  navigationTokens.delete(navigation)
  if (!token || token !== activeToken) return false

  activeToken = undefined
  pending.value = false
  return true
}
