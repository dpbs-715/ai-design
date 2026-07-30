import { toValue, type MaybeRefOrGetter } from 'vue'
import type { RuntimeContext } from '@/runtime/context.ts'
import type { MaterialDataQuery, MaterialSchema } from '@/schema/material.ts'

export interface ResolvedDataQuery {
  params: Record<string, unknown>
  ready: boolean
  debounce: number
}

function isMissingRequiredValue(value: unknown) {
  return (
    value == null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  )
}

export function resolveDataQuery(
  query: MaterialDataQuery | undefined,
  getNodeValue: (nodeId: string) => unknown,
): ResolvedDataQuery {
  const params: Record<string, unknown> = {}
  let ready = true

  query?.params.forEach((param) => {
    const value = getNodeValue(param.source.nodeId)
    if (isMissingRequiredValue(value)) {
      if (param.required) ready = false
      return
    }
    params[param.name] = value
  })

  return {
    params,
    ready,
    debounce: query?.debounce ?? 0,
  }
}

export function useMaterialDataQuery(
  schema: MaybeRefOrGetter<MaterialSchema>,
  runtimeContext: RuntimeContext | null,
) {
  return computed(() =>
    resolveDataQuery(toValue(schema).dataQuery, (nodeId) => runtimeContext?.getNodeValue(nodeId)),
  )
}
