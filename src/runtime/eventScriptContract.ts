export interface EventScriptLayout {
  x: number
  y: number
  width: number
  height: number
}

export interface EventScriptEvent {
  type: string
  name: string
  title?: string
}

export interface EventScriptNode {
  id: string
  type: string
  name: string
  locked?: boolean
  layout: EventScriptLayout
  style?: Record<string, unknown>
  props: Record<string, unknown>
  dataId?: string | number
  events?: EventScriptEvent[]
}

export interface EventScriptVNode {
  type: unknown
  props: Record<string, unknown> | null
  key: string | number | symbol | null
  el: Element | null
  component: unknown
}

export interface EventScriptContext {
  /** 根据节点 ID 获取画布节点。 */
  getNode(id: string): EventScriptNode | undefined
  /** 根据字段名或路径修改节点属性。 */
  setAttribute(id: string, key: string, value: unknown): void
  /** 修改节点 props 中的字段。 */
  setProps(id: string, key: string, value: unknown): void
  /** 修改节点 style 中的字段。 */
  setStyle(id: string, key: string, value: unknown): void
  /** 修改节点 layout 中的字段。 */
  setLayout(id: string, key: string, value: unknown): void
  /** 调用物料组件实例暴露的方法。 */
  trigger(id: string, event: string, ...args: unknown[]): unknown
  /** 刷新绑定到指定数据源的全部节点。 */
  refreshNodesByDataId(dataId: string, ...args: unknown[]): void
  /** 触发指定节点中配置的事件函数。 */
  dispatch(id: string, action: string, payload?: unknown): unknown
}
