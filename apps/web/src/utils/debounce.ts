type AnyFunction = (...args: any[]) => any

interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
}

interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): ReturnType<T> | undefined
  cancel(): void
  flush(): ReturnType<T> | undefined
}

export function debounce<T extends AnyFunction>(
  fn: T,
  wait = 300,
  options: DebounceOptions = {},
): DebouncedFunction<T> {
  const { leading = false, trailing = true } = options

  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingCall:
    | {
        thisArg: ThisParameterType<T>
        args: Parameters<T>
      }
    | undefined
  let result: ReturnType<T> | undefined

  const invoke = () => {
    if (!pendingCall) return result

    result = fn.apply(pendingCall.thisArg, pendingCall.args)
    pendingCall = undefined

    return result
  }

  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const shouldInvokeLeading = leading && !timer

    pendingCall = { thisArg: this, args }

    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      timer = undefined

      if (trailing && pendingCall) {
        invoke()
      } else {
        pendingCall = undefined
      }
    }, wait)

    if (shouldInvokeLeading) {
      return invoke()
    }

    return result
  } as DebouncedFunction<T>

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
    }

    timer = undefined
    pendingCall = undefined
  }

  debounced.flush = () => {
    if (!timer) return result

    clearTimeout(timer)
    timer = undefined

    return trailing ? invoke() : result
  }

  return debounced
}
