import type { Component } from 'vue'
import type { MaterialDefinition, MaterialSchema } from '@/schema/material.ts'
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

export function createNode(node: Omit<MaterialSchema, 'id'>): MaterialSchema {
  return {
    ...node,
    id: crypto.randomUUID(),
  }
}
