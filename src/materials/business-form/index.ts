import type { Component } from 'vue'
import type { MaterialDefinition } from '@/schema/material.ts'
import BusinessFormRuntime from './runtime.vue'
import { businessFormMaterial, formItemMaterials } from './materials.ts'

export {
  businessFormMaterial,
  formCommonSelectMaterial,
  formItemMaterials,
  formInputMaterial,
} from './materials.ts'

export function install(register: (material: MaterialDefinition, component: Component) => void) {
  register(businessFormMaterial, BusinessFormRuntime)
  formItemMaterials.forEach((material) => register(material, BusinessFormRuntime))
}
