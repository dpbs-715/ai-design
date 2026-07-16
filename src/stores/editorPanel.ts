import { defineStore } from 'pinia'

type PanelName = 'material' | 'layer' | 'property'

const panelNames: PanelName[] = ['material', 'layer', 'property']

export const useEditorPanelStore = defineStore('editorPanel', () => {
  const desktopPanelVisible = ref<Record<PanelName, boolean>>({
    material: true,
    layer: false,
    property: true,
  })
  const narrowPanel = ref<PanelName | null>(null)
  const narrowPanelLayout = ref(false)

  const panelVisible = computed<Record<PanelName, boolean>>(() => {
    if (!narrowPanelLayout.value) return desktopPanelVisible.value

    return {
      material: narrowPanel.value === 'material',
      layer: narrowPanel.value === 'layer',
      property: narrowPanel.value === 'property',
    }
  })

  function setNarrowPanelLayout(enabled: boolean) {
    if (narrowPanelLayout.value === enabled) return

    narrowPanelLayout.value = enabled
    if (enabled) {
      narrowPanel.value = panelNames.find((panel) => desktopPanelVisible.value[panel]) ?? null
    }
  }

  function togglePanel(panel: PanelName) {
    if (narrowPanelLayout.value) {
      narrowPanel.value = narrowPanel.value === panel ? null : panel
      return
    }

    desktopPanelVisible.value[panel] = !desktopPanelVisible.value[panel]
  }

  return {
    panelVisible,
    setNarrowPanelLayout,
    togglePanel,
  }
})
