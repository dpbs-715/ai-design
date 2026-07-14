const ecmaScriptGlobals = {
  AggregateError: globalThis.AggregateError,
  Array: globalThis.Array,
  BigInt: globalThis.BigInt,
  Boolean: globalThis.Boolean,
  Date: globalThis.Date,
  Error: globalThis.Error,
  Infinity: globalThis.Infinity,
  Intl: globalThis.Intl,
  JSON: globalThis.JSON,
  Map: globalThis.Map,
  Math: globalThis.Math,
  NaN: globalThis.NaN,
  Number: globalThis.Number,
  Object: globalThis.Object,
  Promise: globalThis.Promise,
  RangeError: globalThis.RangeError,
  ReferenceError: globalThis.ReferenceError,
  Reflect: globalThis.Reflect,
  RegExp: globalThis.RegExp,
  Set: globalThis.Set,
  String: globalThis.String,
  Symbol: globalThis.Symbol,
  SyntaxError: globalThis.SyntaxError,
  TypeError: globalThis.TypeError,
  URIError: globalThis.URIError,
  WeakMap: globalThis.WeakMap,
  WeakSet: globalThis.WeakSet,
  decodeURI: globalThis.decodeURI,
  decodeURIComponent: globalThis.decodeURIComponent,
  encodeURI: globalThis.encodeURI,
  encodeURIComponent: globalThis.encodeURIComponent,
  isFinite: globalThis.isFinite,
  isNaN: globalThis.isNaN,
  parseFloat: globalThis.parseFloat,
  parseInt: globalThis.parseInt,
}

const webPlatformGlobals = {
  URL: globalThis.URL,
  URLSearchParams: globalThis.URLSearchParams,
  atob: globalThis.atob.bind(globalThis),
  btoa: globalThis.btoa.bind(globalThis),
  clearInterval: globalThis.clearInterval.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  console: globalThis.console,
  queueMicrotask: globalThis.queueMicrotask.bind(globalThis),
  setInterval: globalThis.setInterval.bind(globalThis),
  setTimeout: globalThis.setTimeout.bind(globalThis),
  structuredClone: globalThis.structuredClone.bind(globalThis),
}

const sandboxGlobals = {
  ...ecmaScriptGlobals,
  ...webPlatformGlobals,
}

type SandboxGlobalName = keyof typeof sandboxGlobals
type SandboxScope = Record<string, unknown>

export function runSandbox(code: string, scope: SandboxScope): Promise<unknown> {
  const sandbox = new Proxy(scope, {
    has() {
      return true
    },
    get(target, key) {
      if (key === Symbol.unscopables) return
      if (Object.hasOwn(target, key)) {
        return Reflect.get(target, key)
      }
      if (typeof key === 'string' && Object.hasOwn(sandboxGlobals, key)) {
        return sandboxGlobals[key as SandboxGlobalName]
      }
    },
  })

  const execute = new Function(
    'sandbox',
    `
    with (sandbox) {
      return (async () => {
          ${code}
      })()
    }
  `,
  ) as (sandbox: SandboxScope) => Promise<unknown>

  return execute(sandbox)
}
