import type { Component } from 'vue'
import type {
  MaterialDefinition,
  MaterialSchema,
  MaterialTemplate,
} from '@/schema/material.ts'
import type { PageRootSchema } from '@/schema/page.ts'
import { deepClone } from '@vunio/utils'
import { commonMaterialEventOptions, createMaterialEventOptionGroups } from './events.ts'

export { filterMaterialEventOptionGroups } from './events.ts'

const materials: MaterialDefinition[] = []

const componentMap = new Map<string, Component>()
const materialMap = new Map<string, MaterialDefinition>()

export function register(material: MaterialDefinition, component: Component) {
  materials.push(material)
  componentMap.set(material.schema.type, component)
  materialMap.set(material.schema.type, material)
}

const materialModules = import.meta.glob('./*/index.ts', { eager: true })
Object.values(materialModules).forEach((module: any) => {
  module.install(register)
})

const group = [
  {
    name: '容器',
    icon: 'fluent:panel-left-expand-20-filled',
    key: 'container',
  },
  {
    name: '图表',
    icon: 'fluent:data-bar-vertical-20-filled',
    key: 'charts',
  },
  {
    name: '文本',
    icon: 'fluent:text-font-20-filled',
    key: 'info',
  },
  {
    name: '图片',
    icon: 'fluent:image-20-filled',
    key: 'media',
  },
  {
    name: '标注',
    icon: 'fluent:draw-shape-20-filled',
    key: 'annotation',
  },
]

export function getMaterialByGroup(group: string) {
  return materials.filter((item) => item.group === group)
}

export function geyMaterialGroups() {
  return group
}

export function getMaterialComponent(type: string) {
  return componentMap.get(type)
}

export function getMaterialDefinition(type: string) {
  return materialMap.get(type)
}

export function isContainerMaterial(type: string) {
  return materialMap.get(type)?.capability?.kind === 'container'
}

export function canMaterialAcceptChild(
  parent: MaterialSchema | PageRootSchema,
  child: MaterialSchema,
) {
  if (parent.type === 'page-root') return true

  const parentCapability = materialMap.get(parent.type)?.capability
  if (parentCapability?.kind !== 'container') return false
  if (!parentCapability.accepts?.length) return true

  const childRoles = materialMap.get(child.type)?.capability?.roles ?? ['canvas-content']
  return childRoles.some((role) => parentCapability.accepts?.includes(role))
}

const defaultMaterialIcon = 'fluent:data-bar-vertical-20-filled'

export function getMaterialIcon(type: string) {
  return materialMap.get(type)?.icon ?? defaultMaterialIcon
}
export function getMaterialSetters(type: string) {
  return materialMap.get(type)?.setters || []
}

export function getMaterialEventOptions(type: string) {
  return [...commonMaterialEventOptions, ...(materialMap.get(type)?.customEventOptions ?? [])]
}

export function getMaterialEventOptionGroups(type: string) {
  return createMaterialEventOptionGroups(materialMap.get(type)?.customEventOptions ?? [])
}

export function getMaterialDataBindings(type: string) {
  return materialMap.get(type)?.dataBindings || []
}

function assignNodeIds(template: MaterialTemplate): MaterialSchema {
  const { children = [], ...nodeTemplate } = template
  const node = deepClone(nodeTemplate)
  return {
    ...node,
    id: crypto.randomUUID(),
    lockKey: undefined,
    children: children.map(assignNodeIds),
  }
}

export function createNode(node: MaterialTemplate): MaterialSchema {
  return assignNodeIds(node)
}
