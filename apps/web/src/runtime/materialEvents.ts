import { camelize, toHandlerKey } from 'vue'
import type { MaterialSchema } from '@/schema/material.ts'
import type { RuntimeContext } from '@/runtime/context.ts'

export type MaterialEventProps = Record<string, (...args: unknown[]) => unknown>

export function createMaterialEventProps(
  node: MaterialSchema,
  context: RuntimeContext,
): MaterialEventProps {
  const listeners: MaterialEventProps = {}

  node.events?.forEach((event) => {
    const eventProp = toHandlerKey(camelize(event.type))
    const previousListener = listeners[eventProp]
    listeners[eventProp] = (...args) => {
      previousListener?.(...args)
      return context.executeEvent(node, event, args[0])
    }
  })

  return listeners
}
