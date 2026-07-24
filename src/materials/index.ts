import type { Component } from 'vue'
import type { MaterialDefinition, MaterialSchema, MaterialTemplate } from '@/schema/material.ts'
import type { PageRootSchema } from '@/schema/page.ts'
import { deepClone } from '@vunio/utils'
import { commonMaterialEventOptions, createMaterialEventOptionGroups } from './events.ts'

export { filterMaterialEventOptionGroups } from './events.ts'

const materials: MaterialDefinition[] = []

const componentMap = new Map<string, Component>()
const editorComponentMap = new Map<string, Component>()
const materialMap = new Map<string, MaterialDefinition>()

export function register(material: MaterialDefinition, component: Component) {
  materials.push(material)
  componentMap.set(material.schema.type, component)
  if (material.editorComponent) {
    editorComponentMap.set(material.schema.type, material.editorComponent)
  }
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
  {
    name: '表单',
    icon: 'fluent:form-20-filled',
    key: 'form',
  },
]

export function getMaterialByGroup(group: string) {
  return materials.filter((item) => item.group === group)
}

export function geyMaterialGroups() {
  return group
}

export function getMaterialComponent(type: string, mode: 'editor' | 'runtime' = 'runtime') {
  return mode === 'editor'
    ? (editorComponentMap.get(type) ?? componentMap.get(type))
    : componentMap.get(type)
}

export function getMaterialDefinition(type: string) {
  return materialMap.get(type)
}

export function isContainerMaterial(type: string) {
  return materialMap.get(type)?.capability?.kind === 'container'
}

export function isMaterialChildrenRenderer(type: string) {
  return materialMap.get(type)?.childrenRenderer !== 'material'
}

export function canMaterialTypeBeChild(parent: MaterialSchema | PageRootSchema, childType: string) {
  const childRoles = materialMap.get(childType)?.capability?.roles ?? ['canvas-content']
  const acceptedRoles =
    parent.type === 'page-root'
      ? ['canvas-content']
      : materialMap.get(parent.type)?.capability?.accepts

  if (parent.type !== 'page-root') {
    const parentCapability = materialMap.get(parent.type)?.capability
    if (parentCapability?.kind !== 'container') return false
  }

  if (!acceptedRoles?.length) return false
  return childRoles.some((role) => acceptedRoles.includes(role))
}

export function canMaterialAcceptChild(
  parent: MaterialSchema | PageRootSchema,
  child: MaterialSchema,
) {
  return canMaterialTypeBeChild(parent, child.type)
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
