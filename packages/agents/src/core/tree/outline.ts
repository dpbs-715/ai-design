import { createMaterialTreeIndex } from '@ai-design/contracts'
import type { MaterialSchema, PageSchema } from '@ai-design/contracts'
import { getMaterialDescriptor } from '@ai-design/materials'

/**
 * 把页面结构渲染成缩进文本给 LLM 看。
 *
 * 每行带上物料是容器还是叶子 —— 模型据此判断能不能往里放子节点,
 * 不必再猜。
 */
export function formatPageOutline(page: PageSchema): string {
  const tree = createMaterialTreeIndex(page.root.children, page.root.id)
  const depthOf = (nodeId: string) => {
    let depth = 0
    let current = tree.parentIdMap.get(nodeId)
    while (current && current !== page.root.id) {
      depth += 1
      current = tree.parentIdMap.get(current)
    }
    return depth
  }

  const describe = (node: MaterialSchema) => {
    const descriptor = getMaterialDescriptor(node.type)
    const shape = descriptor?.capability.kind === 'container' ? '容器' : '叶子'
    const indent = '  '.repeat(depthOf(node.id) + 1)
    return `${indent}- id=${node.id} type=${node.type}(${node.name}) ${shape}`
  }

  const canvas = page.root.placement
  const header = `根节点 id=${page.root.id} type=${page.root.type} 画布=${canvas.width}x${canvas.height}`

  if (tree.nodes.length === 0) {
    return [header, '  (画布为空)'].join('\n')
  }

  return [header, ...tree.nodes.map(describe)].join('\n')
}

/** 列出选中节点的 id 与 type,给 LLM 定位用户当前关注的对象。 */
export function formatSelectedNodes(page: PageSchema, selectedNodeIds: string[]): string {
  if (selectedNodeIds.length === 0) return '无'
  const tree = createMaterialTreeIndex(page.root.children, page.root.id)
  return selectedNodeIds
    .map((id) => {
      const node = tree.nodeMap.get(id)
      return node ? `${id}(${node.type})` : `${id}(已不存在)`
    })
    .join(', ')
}
