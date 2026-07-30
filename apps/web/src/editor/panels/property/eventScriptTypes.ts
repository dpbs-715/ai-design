import type { MonacoExtraLib } from '@/components/MonacoEditor/types.ts'
import eventScriptContractSource from '@/runtime/eventScriptContract.ts?raw'

const EVENT_SCRIPT_LIB_PATH = 'file:///event-script-api.d.ts'
const DEFAULT_PAYLOAD_TYPE = 'unknown'

export function createEventScriptExtraLib(payloadType?: string): MonacoExtraLib {
  return {
    filePath: EVENT_SCRIPT_LIB_PATH,
    content: `${eventScriptContractSource}

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
