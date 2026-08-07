import { describe, expect, it } from 'vitest'
import {
  EVENT_SCRIPT_API_DECLARATION,
  EVENT_SCRIPT_CONTEXT_METHODS,
} from '@ai-design/contracts'

/**
 * 锁住 `EventScriptContext` interface 与 `EVENT_SCRIPT_API_DECLARATION` 文本。
 *
 * 方法名这一维已经由 event-script.ts 里的编译期断言锁住(漏了方法就编译不过);
 * 这里检查声明文本里确实有这些方法 —— 漏了一个或拼错了,测试失败。
 *
 * 反向(文本里有、数组里没有)不检查,因为文本里还声明了 EventScriptNode /
 * EventScriptVNode,没必要把它们也塞进数组。只要保证「数组承诺的每个方法
 * 都真的在文本里」就够了 —— 那是 agent 依赖的契约。
 */
describe('EVENT_SCRIPT_API_DECLARATION', () => {
  it('包含 EVENT_SCRIPT_CONTEXT_METHODS 里列出的每个方法', () => {
    for (const methodName of EVENT_SCRIPT_CONTEXT_METHODS) {
      // 声明格式是 `方法名(参数): 返回值`,所以方法名后必跟 `(`。
      const pattern = `${methodName}(`
      expect(
        EVENT_SCRIPT_API_DECLARATION.includes(pattern),
        `EVENT_SCRIPT_API_DECLARATION 里找不到方法 ${methodName}`,
      ).toBe(true)
    }
  })
})
