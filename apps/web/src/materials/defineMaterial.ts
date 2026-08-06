import type { MaterialDescriptor } from '@ai-design/materials'
import type { MaterialDefinition } from './definition.ts'

/** 物料定义里由 web 端提供的部分 —— 组件、预览卡片、属性面板配置。 */
export type MaterialViewDefinition = Omit<
  MaterialDefinition,
  'name' | 'group' | 'capability' | 'resizeConstraints' | 'schema'
>

/**
 * 把纯数据描述符和 web 端的 Vue 实现合成完整的 MaterialDefinition。
 * 元数据(名称/分组/容纳能力/模板)只在 @ai-design/materials 里维护一份,
 * server 端 agent 也读同一份数据。
 */
export function defineMaterial(
  descriptor: MaterialDescriptor,
  view: MaterialViewDefinition,
): MaterialDefinition {
  return {
    ...view,
    name: descriptor.name,
    group: descriptor.group,
    ...(descriptor.capability ? { capability: descriptor.capability } : {}),
    ...(descriptor.resizeConstraints ? { resizeConstraints: descriptor.resizeConstraints } : {}),
    schema: descriptor.template,
  }
}
