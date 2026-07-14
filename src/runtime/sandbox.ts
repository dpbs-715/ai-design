const globalKeys = new Set(['console', 'Promise', 'setTimeout'])

export function runSandbox(code: string, scope: Record<string, any>) {
  const sandbox = new Proxy(scope, {
    has: () => {
      return true
    },
    get: (target, key) => {
      if (key === Symbol.unscopables) return
      if (Object.hasOwn(target, key)) {
        return target[key as string]
      }
      if (globalKeys.has(key as string)) {
        const value = globalThis[key]
        return typeof value === 'function' ? value.bind(globalThis) : value
      }
    },
  })

  const fn = new Function(
    'sandbox',
    `
    const asyncFn = async ()=>{
       with (sandbox) {
          ${code}
      }
    }
    asyncFn()
  `,
  )
  fn(sandbox)
}
