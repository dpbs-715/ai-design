/**
 * 事件脚本(节点 `events[].code`)的运行时契约。
 *
 * 放在 contracts 而不是 web 里,因为有两个消费方需要同一份定义:
 * - 编辑器把它喂给 Monaco 当 `.d.ts`,人写事件时有补全;
 * - agent 把它放进 prompt,模型才知道 `code` 里能调什么。
 *
 * 两边共享的是下面的 `EVENT_SCRIPT_API_DECLARATION` 字符串,而不是本文件的源码 ——
 * Vite 的 `?raw` 只在 web 侧可用,agent 跑在 Node 里拿不到源文件;而 contracts
 * 编译产物里纯类型文件是空的,`?raw` 读过去也是空字符串。所以声明文本必须
 * 是一个真正的导出常量。
 *
 * 代价是声明文本与下面的 interface 是同一份 API 的两种表示,可能漂。
 * `EVENT_SCRIPT_CONTEXT_METHODS` 把方法名这一维锁住了:
 * 少一个方法编译不过(见文件末尾的 exhaustive 断言),名字对不上则测试失败。
 * 参数类型层面的漂只能靠 review —— 但方法增删是实际会发生的变更,签名微调不是。
 */

export type EventScriptPlacement =
  | {
      type: 'absolute'
      x: number
      y: number
      width: number
      height: number
    }
  | {
      type: 'form-item'
      span: number
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
  lockKey?: string
  placement: EventScriptPlacement
  children: EventScriptNode[]
  style?: Record<string, unknown>
  props: Record<string, unknown>
  dataId?: string | number
  dataQuery?: {
    params: Array<{
      id: string
      name: string
      source: {
        type: 'form-item'
        nodeId: string
      }
      required: boolean
    }>
    debounce?: number
  }
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
  /** 修改节点 placement 中的字段。 */
  setPlacement(id: string, key: string, value: unknown): void
  /** 调用物料组件实例暴露的方法。 */
  trigger(id: string, event: string, ...args: unknown[]): unknown
  /** 获取表单项等可提供值的节点当前值。 */
  getNodeValue(id: string): unknown
  /** 刷新绑定到指定数据源的全部节点。 */
  refreshNodesByDataId(dataId: string | number, ...args: unknown[]): void
  /** 触发指定节点中配置的事件函数。 */
  dispatch(id: string, action: string, payload?: unknown): Promise<unknown> | undefined
}

/**
 * `EventScriptContext` 的全部方法名。
 *
 * 存在的意义是把「interface」和「声明文本」这两份表示钉在一起:
 * - 往 interface 加方法但忘了加进这里 → 文件末尾的 exhaustive 断言编译失败;
 * - 这里有的名字在声明文本里找不到 → contracts 的测试失败。
 */
export const EVENT_SCRIPT_CONTEXT_METHODS = [
  'getNode',
  'setAttribute',
  'setProps',
  'setStyle',
  'setPlacement',
  'trigger',
  'getNodeValue',
  'refreshNodesByDataId',
  'dispatch',
] as const satisfies readonly (keyof EventScriptContext)[]

/** interface 里有、上面数组里漏了的方法 —— 必须为 never。 */
type UndeclaredContextMethod = Exclude<
  keyof EventScriptContext,
  (typeof EVENT_SCRIPT_CONTEXT_METHODS)[number]
>

// 漏了方法就在这里编译失败,错误信息会指向缺失的名字。
const _allContextMethodsDeclared: UndeclaredContextMethod extends never ? true : never = true
void _allContextMethodsDeclared

/**
 * 事件脚本 API 的 `.d.ts` 文本。
 *
 * 编辑器把它注册成 Monaco 的额外类型库,agent 把它嵌进 prompt。
 * 不含 `$payload` 的声明 —— payload 类型随事件种类变化,由消费方按需补一行。
 */
export const EVENT_SCRIPT_API_DECLARATION = `interface EventScriptEvent {
  type: string
  name: string
  title?: string
}

interface EventScriptNode {
  id: string
  type: string
  name: string
  lockKey?: string
  placement:
    | { type: 'absolute'; x: number; y: number; width: number; height: number }
    | { type: 'form-item'; span: number }
  children: EventScriptNode[]
  style?: Record<string, unknown>
  props: Record<string, unknown>
  dataId?: string | number
  events?: EventScriptEvent[]
}

interface EventScriptVNode {
  type: unknown
  props: Record<string, unknown> | null
  key: string | number | symbol | null
  el: Element | null
  component: unknown
}

interface EventScriptContext {
  /** 根据节点 ID 获取画布节点。 */
  getNode(id: string): EventScriptNode | undefined
  /** 根据字段名或路径修改节点属性,key 支持 'props.text' 这样的路径。 */
  setAttribute(id: string, key: string, value: unknown): void
  /** 修改节点 props 中的字段。 */
  setProps(id: string, key: string, value: unknown): void
  /** 修改节点 style 中的字段。 */
  setStyle(id: string, key: string, value: unknown): void
  /** 修改节点 placement 中的字段。 */
  setPlacement(id: string, key: string, value: unknown): void
  /** 调用物料组件实例暴露的方法,比如打开弹窗、提交表单、刷新图表。 */
  trigger(id: string, event: string, ...args: unknown[]): unknown
  /** 获取表单项等可提供值的节点当前值。 */
  getNodeValue(id: string): unknown
  /** 刷新绑定到指定数据源的全部节点。 */
  refreshNodesByDataId(dataId: string | number, ...args: unknown[]): void
  /** 触发指定节点中配置的另一个事件函数,按事件的 name 查找。 */
  dispatch(id: string, action: string, payload?: unknown): Promise<unknown> | undefined
}`
