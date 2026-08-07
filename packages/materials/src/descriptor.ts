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
 * 物料组件实例暴露给事件脚本的一个方法,即 `$context.trigger(id, name, ...)`
 * 的合法目标。
 *
 * 这些方法原先只以 TS interface 的形式写在各物料的 .vue 里(`defineExpose`),
 * 描述符不带,于是 agent 完全不知道有哪些方法可调,编辑器里写 `trigger`
 * 也没有任何提示 —— `trigger` 的第二个参数就是个裸 string。
 *
 * `signature` 是给人和模型看的文本,不参与类型检查;真正的类型仍在 .vue 的
 * Expose interface 里。两边的方法名由 web 侧的编译期断言锁住(见
 * apps/web/src/materials/exposedMethods.ts)。
 */
export interface MaterialExposedMethod {
  /** 方法名,`trigger` 的第二个参数。 */
  name: string
  /** TS 风格签名,例如 `open(): void`。 */
  signature: string
  /** 用途说明,决定模型会不会在合适的场景调它。 */
  description: string
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
  /**
   * 事件脚本可通过 `$context.trigger` 调用的实例方法。
   * 没有暴露方法的物料(纯展示类)省略该字段。
   *
   * readonly:同一份数组被多个描述符共享(四个图表共用一份、七个表单项共用一份),
   * 可变类型会让调用方以为能安全 push。
   */
  exposedMethods?: readonly MaterialExposedMethod[]
  /** 新建节点时使用的模板(不含 id 与 children id)。 */
  template: MaterialTemplate
}

export interface MaterialGroup {
  key: string
  name: string
}
