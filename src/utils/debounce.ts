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
  let lastArgs: Parameters<T> | undefined
  let lastThis: ThisParameterType<T>
  let result: ReturnType<T> | undefined

  const invoke = () => {
    if (!lastArgs) return result

    result = fn.apply(lastThis, lastArgs)
    lastArgs = undefined

    return result
  }

  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const shouldInvokeLeading = leading && !timer

    lastArgs = args
    lastThis = this

    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      timer = undefined

      if (trailing && lastArgs) {
        invoke()
      } else {
        lastArgs = undefined
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
    lastArgs = undefined
  }

  debounced.flush = () => {
    if (!timer) return result

    clearTimeout(timer)
    timer = undefined

    return trailing ? invoke() : result
  }

  return debounced
}
