import { useEditorPanelStore } from '@/stores/editorPanel.ts'

const NARROW_WORKSPACE_QUERY = '(max-width: 1199px)'

export function useResponsiveEditorLayout() {
  const editorPanelStore = useEditorPanelStore()
  const isNarrowWorkspace = ref(false)
  let narrowWorkspaceQuery: MediaQueryList | undefined

  function syncWorkspaceLayout(query: MediaQueryList | MediaQueryListEvent) {
    isNarrowWorkspace.value = query.matches
    editorPanelStore.setNarrowPanelLayout(query.matches)
  }

  onMounted(() => {
    narrowWorkspaceQuery = window.matchMedia(NARROW_WORKSPACE_QUERY)
    syncWorkspaceLayout(narrowWorkspaceQuery)
    narrowWorkspaceQuery.addEventListener('change', syncWorkspaceLayout)
  })

  onBeforeUnmount(() => {
    narrowWorkspaceQuery?.removeEventListener('change', syncWorkspaceLayout)
    editorPanelStore.setNarrowPanelLayout(false)
  })

  const materialWidth = computed(() => {
    if (!editorPanelStore.panelVisible.material) return '0'
    return isNarrowWorkspace.value ? 'min(260px, 42vw)' : '260px'
  })
  const layerWidth = computed(() => (editorPanelStore.panelVisible.layer ? '160px' : '0'))
  const propertyWidth = computed(() => {
    if (!editorPanelStore.panelVisible.property) return '0'
    return isNarrowWorkspace.value ? 'min(360px, 42vw)' : '360px'
  })

  return {
    isNarrowWorkspace,
    materialWidth,
    layerWidth,
    propertyWidth,
  }
}
