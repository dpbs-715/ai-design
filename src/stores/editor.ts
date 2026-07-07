import { defineStore } from 'pinia'
import type { MaterialSchema } from '@/materials/types.ts'

export const useEditorStore = defineStore('editor', () => {
  const panelVisible = reactive({
    material: true,
    layer: true,
    property: true,
  })

  const nodes = ref<MaterialSchema[]>([])

  const selectedNodeId = ref()

  const selectedNode = computed(() => {
    return nodes.value.find((node) => node.id === selectedNodeId.value)
  })

  function addNode(node: MaterialSchema) {
    nodes.value.push(node)
  }
  function selectNode(id: string) {
    selectedNodeId.value = id
  }

  function clearSelectedNode() {
    selectedNodeId.value = null
  }

  return {
    panelVisible,
    nodes,
    selectedNodeId,
    selectedNode,
    addNode,
    selectNode,
    clearSelectedNode,
  }
})
