import type { MaterialDefinition } from '@/schema/material.ts'

const materials: MaterialDefinition[] = []

const componentMap = new Map()
const settersMap = new Map()

export function register(material: MaterialDefinition, component: Component) {
  materials.push(material)
  componentMap.set(material.schema.type, component)
  settersMap.set(material.schema.type, material.setters)
}

const materialModules = import.meta.glob('./*/index.ts', { eager: true })
Object.values(materialModules).forEach((module: any) => {
  module.install(register)
})

const group = [
  {
    name: '信息',
    icon: 'material-symbols:info',
    key: 'info',
  },
  {
    name: '图表',
    icon: 'solar:chart-bold',
    key: 'charts',
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
  return settersMap.get(type)
}

export function createNode(node) {
  return {
    ...node,
    id: crypto.randomUUID(),
  }
}
