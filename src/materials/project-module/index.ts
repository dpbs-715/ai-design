import type { MaterialDefinition, MaterialTemplate } from '@/schema/material.ts'
import type { PublicModuleRecord } from '@/workspace/types.ts'
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
  supportsDataSource: true,
  dataBindings: [{ label: '显示值', field: 'props.valueField' }],
  setters: [
    {
      component: 'input',
      label: '标题',
      field: 'props.title',
      span: 24,
      props: { placeholder: '输入模块实例标题' },
    },
    {
      component: 'number',
      label: '显示数量',
      field: 'props.displayCount',
      span: 24,
      props: { min: 1, max: 6, precision: 0 },
    },
  ],
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
      moduleVersion: 'v1',
      availableVersion: 'v1',
      title: '公共模块',
      displayCount: 3,
      parameters: {},
      valueField: 'value',
    },
    events: [],
  },
}

export function createProjectModuleTemplate(publicModule: PublicModuleRecord): MaterialTemplate {
  return {
    ...projectModuleMaterial.schema,
    name: publicModule.name,
    placement: { ...projectModuleMaterial.schema.placement },
    props: {
      ...projectModuleMaterial.schema.props,
      moduleId: publicModule.id,
      moduleVersion: publicModule.version,
      availableVersion: publicModule.version,
      title: publicModule.name,
      parameters: {},
    },
  }
}

export function install(register: (material: MaterialDefinition, component: Component) => void) {
  register(projectModuleMaterial, ProjectModuleInstance)
}
