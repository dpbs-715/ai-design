import type { MaterialDefinition } from '@/materials/types.ts'

const materials: MaterialDefinition[] = []

export function register(material: MaterialDefinition) {
  materials.push(material)
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
