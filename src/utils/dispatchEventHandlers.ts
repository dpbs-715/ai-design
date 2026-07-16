type EventHandler = (this: any, ...args: any[]) => unknown

type CompatibleEventHandler<T extends EventHandler> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => unknown

export function dispatchEventHandlers<T extends EventHandler>(
  primaryHandler: T,
  ...additionalHandlers: CompatibleEventHandler<T>[]
) {
  const handlers: CompatibleEventHandler<T>[] = [primaryHandler, ...additionalHandlers]

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    handlers.forEach((handler) => handler.apply(this, args))
  }
}
