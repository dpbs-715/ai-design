import type { MaterialSchema } from '@/schema/material.ts'

export interface MaterialTreeIndex {
  nodes: MaterialSchema[]
  nodeMap: Map<string, MaterialSchema>
  parentIdMap: Map<string, string>
}

export function createMaterialTreeIndex(
  children: MaterialSchema[],
  rootId: string,
): MaterialTreeIndex {
  const nodes: MaterialSchema[] = []
  const nodeMap = new Map<string, MaterialSchema>()
  const parentIdMap = new Map<string, string>()

  function visit(node: MaterialSchema, parentId: string) {
    nodes.push(node)
    nodeMap.set(node.id, node)
    parentIdMap.set(node.id, parentId)
    node.children.forEach((child) => visit(child, node.id))
  }

  children.forEach((node) => visit(node, rootId))
  return { nodes, nodeMap, parentIdMap }
}

export function mapMaterialTree(
  children: MaterialSchema[],
  transform: (node: MaterialSchema) => MaterialSchema,
): MaterialSchema[] {
  let changed = false
  const mappedChildren = children.map((node) => {
    const nextNode = transform(node)
    const nextChildren = mapMaterialTree(nextNode.children, transform)
    const mappedNode =
      nextChildren === nextNode.children ? nextNode : { ...nextNode, children: nextChildren }
    if (mappedNode !== node) changed = true
    return mappedNode
  })
  return changed ? mappedChildren : children
}

export function someMaterialNode(
  children: MaterialSchema[],
  predicate: (node: MaterialSchema) => boolean,
): boolean {
  return children.some(
    (node) => predicate(node) || someMaterialNode(node.children, predicate),
  )
}
