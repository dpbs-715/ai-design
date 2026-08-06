import type { MaterialTemplate } from '@ai-design/contracts'

/**
 * 物料的容纳能力。`kind` 决定它能否有子节点,`roles` 是它自身扮演的角色,
 * `accepts` 是它作为容器时允许接纳的子节点角色。
 */
export interface MaterialCapability {
  kind: 'leaf' | 'container'
  roles: string[]
  accepts?: string[]
}

/** 编辑器调整尺寸时的下限约束。 */
export interface MaterialResizeConstraints {
  minWidth?: number
  minHeight?: number
}

/**
 * 物料的纯数据描述符 —— 不含任何 Vue 组件或渲染实现,
 * 因此可以同时被 web 编辑器和 server 端 agent 使用。
 */
export interface MaterialDescriptor {
  /**
   * 物料面板里的唯一标识。多数物料等于 `type`;
   * 同一 `type` 有多个预设时(如 annotation-frame 的四个预设)靠 `key` 区分。
   */
  key: string
  /** 物料类型,等于 template.type。多个预设可以共用同一个 type。 */
  type: string
  /** 展示名称。 */
  name: string
  /** 所属分组 key。 */
  group: string
  /** 给 LLM 看的用途说明,决定它会不会选中这个物料。 */
  description: string
  capability: MaterialCapability
  resizeConstraints?: MaterialResizeConstraints
  /** 新建节点时使用的模板(不含 id 与 children id)。 */
  template: MaterialTemplate
}

export interface MaterialGroup {
  key: string
  name: string
}
