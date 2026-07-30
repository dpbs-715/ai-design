import type { MaterialDefinition, MaterialTemplate } from '@/schema/material.ts'
import type { PublicModuleRecord } from '@/workspace/types.ts'
import { createModuleInstanceInputs, projectModuleInstanceNodeSchema } from '@/schema/module.ts'
import type { Component } from 'vue'
import ProjectModuleInstance from './component.vue'
import ProjectModulePreview from './preview.vue'

export const projectModuleMaterial: MaterialDefinition = {
  name: '项目公共模块',
  group: 'project-modules',
  icon: 'fluent:puzzle-piece-20-filled',
  preview: {
    component: ProjectModulePreview,
  },
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
  },
  validationSchema: projectModuleInstanceNodeSchema,
  setters: [],
  schema: {
    type: 'project-module-instance',
    name: '公共模块实例',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 520,
      height: 240,
    },
    props: {
      moduleId: '',
      version: 'v1',
      updatePolicy: 'manual',
      inputs: {},
      outputHandlers: {},
    },
    events: [],
  },
}

export function createProjectModuleTemplate(publicModule: PublicModuleRecord): MaterialTemplate {
  const moduleName = publicModule.schema.root.name
  const version =
    publicModule.versions.find((candidate) => candidate.version === publicModule.version) ??
    publicModule.versions.at(-1)
  if (!version) {
    throw new Error(`Public module ${publicModule.id} has no published version`)
  }
  const moduleSchema = version.schema
  return {
    ...projectModuleMaterial.schema,
    name: moduleName,
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: moduleSchema.root.placement.width,
      height: moduleSchema.root.placement.height,
    },
    props: {
      moduleId: publicModule.id,
      version: publicModule.version,
      updatePolicy: 'manual',
      inputs: createModuleInstanceInputs(moduleSchema),
      outputHandlers: {},
    },
  }
}

export function install(register: (material: MaterialDefinition, component: Component) => void) {
  register(projectModuleMaterial, ProjectModuleInstance)
}
