const COMPACT_SIDEBAR_QUERY = '(max-width: 1040px)'
const MOBILE_DRAWER_QUERY = '(max-width: 700px)'

export function useWorkspaceResponsive() {
  const isCompact = ref(false)
  const isMobile = ref(false)
  let compactQuery: MediaQueryList | undefined
  let mobileQuery: MediaQueryList | undefined

  function update() {
    isCompact.value = compactQuery?.matches ?? false
    isMobile.value = mobileQuery?.matches ?? false
  }

  onMounted(() => {
    compactQuery = window.matchMedia(COMPACT_SIDEBAR_QUERY)
    mobileQuery = window.matchMedia(MOBILE_DRAWER_QUERY)
    update()
    compactQuery.addEventListener('change', update)
    mobileQuery.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    compactQuery?.removeEventListener('change', update)
    mobileQuery?.removeEventListener('change', update)
  })

  return { isCompact, isMobile }
}
