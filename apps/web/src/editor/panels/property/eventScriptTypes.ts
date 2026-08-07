import { EVENT_SCRIPT_API_DECLARATION } from '@ai-design/contracts'
import type { MonacoExtraLib } from '@/components/MonacoEditor/types.ts'

const EVENT_SCRIPT_LIB_PATH = 'file:///event-script-api.d.ts'
const DEFAULT_PAYLOAD_TYPE = 'unknown'

/**
 * 事件脚本的 Monaco 类型库。
 *
 * 声明文本来自 contracts 的 `EVENT_SCRIPT_API_DECLARATION` —— 与 agent
 * prompt 里那份是同一个常量,改一处两边同时生效。原先这里读的是
 * `eventScriptContract.ts?raw`,那条路只有 web 能走,agent 拿不到。
 */
export function createEventScriptExtraLib(payloadType?: string): MonacoExtraLib {
  return {
    filePath: EVENT_SCRIPT_LIB_PATH,
    content: `${EVENT_SCRIPT_API_DECLARATION}

declare global {
  /** 当前事件可调用的画布运行时 API。 */
  const $context: EventScriptContext
  /** 当前触发事件的画布节点。 */
  const $node: EventScriptNode
  /** 当前事件携带的数据。 */
  const $payload: ${payloadType ?? DEFAULT_PAYLOAD_TYPE}
}
`,
  }
}
