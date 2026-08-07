import type { MaterialEvent, MaterialSchema } from '@/schema/material.ts'
import type { PageSchema } from '@/schema/page.ts'
import { createMaterialTreeIndex } from '@/schema/nodeTree.ts'
import { setByKeyOrPath } from '@vunio/utils'
import type { EventScriptContext } from '@ai-design/contracts'
import { runSandbox } from '@/runtime/sandbox.ts'

export interface RuntimeContext extends EventScriptContext {
  getNode(id: string): MaterialSchema | undefined
  executeEvent(node: MaterialSchema, event: MaterialEvent, payload: unknown): Promise<unknown>
  reportEventFailure(failure: RuntimeEventFailure): void
  registerNodeInstance(id: string, instance: unknown): void
  unregisterNodeInstance(id: string): void
  registerNodeValue(id: string, getValue: () => unknown): () => void
}

export interface RuntimeEventFailure {
  error: unknown
  event: MaterialEvent
  node: MaterialSchema
}

export interface RuntimeContextOptions {
  onEventFailure?: (failure: RuntimeEventFailure) => void
  writeAttribute?: (node: MaterialSchema, key: string, value: unknown) => void
}

export function createRuntimeContext(
  page: Ref<PageSchema>,
  options: RuntimeContextOptions = {},
): RuntimeContext {
  const instanceMap = new Map<string, any>()
  const nodeValueGetters = shallowReactive(new Map<string, () => unknown>())
  const treeIndex = computed(() =>
    createMaterialTreeIndex(page.value.root.children, page.value.root.id),
  )

  const getNode: RuntimeContext['getNode'] = (id) => {
    return treeIndex.value.nodeMap.get(id)
  }

  const setAttribute: RuntimeContext['setAttribute'] = (id, key, value) => {
    const node = getNode(id)
    if (!node) {
      console.warn(`Node ${id} not found`)
      return
    }
    if (options.writeAttribute) {
      options.writeAttribute(node, key, value)
      return
    }
    setByKeyOrPath(node, key, value)
  }

  const setProps: RuntimeContext['setProps'] = (id, key, value) => {
    setAttribute(id, `props.${key}`, value)
  }

  const setStyle: RuntimeContext['setStyle'] = (id, key, value) => {
    setAttribute(id, `style.${key}`, value)
  }

  const setPlacement: RuntimeContext['setPlacement'] = (id, key, value) => {
    setAttribute(id, `placement.${key}`, value)
  }

  const registerNodeInstance: RuntimeContext['registerNodeInstance'] = (id, instance) => {
    instanceMap.set(id, instance)
  }

  const unregisterNodeInstance: RuntimeContext['unregisterNodeInstance'] = (id) => {
    instanceMap.delete(id)
  }

  const registerNodeValue: RuntimeContext['registerNodeValue'] = (id, getValue) => {
    nodeValueGetters.set(id, getValue)
    return () => {
      if (nodeValueGetters.get(id) === getValue) nodeValueGetters.delete(id)
    }
  }

  const getNodeValue: RuntimeContext['getNodeValue'] = (id) => {
    return nodeValueGetters.get(id)?.()
  }

  const trigger: RuntimeContext['trigger'] = (id, event, ...args) => {
    const instance = instanceMap.get(id)

    if (!instance) {
      console.warn(`Instance ${id} not found`)
      return
    }
    return instance[event]?.(...args)
  }

  const refreshNodesByDataId: RuntimeContext['refreshNodesByDataId'] = (dataId, ...args) => {
    const nodes = treeIndex.value.nodes.filter((node) => node.dataId === dataId)
    nodes.forEach((node) => {
      trigger(node.id, 'refresh', ...args)
    })
  }

  const executeEvent: RuntimeContext['executeEvent'] = (node, event, payload) => {
    return runSandbox(event.code, {
      $context: context,
      $node: node,
      $payload: payload,
    })
  }

  const reportEventFailure: RuntimeContext['reportEventFailure'] = ({ error, event, node }) => {
    console.error(`Event ${event.name} on node ${node.id} failed`, error)
    options.onEventFailure?.({ error, event, node })
  }

  const dispatch: RuntimeContext['dispatch'] = (id, action, payload) => {
    const node = getNode(id)
    if (!node) {
      console.warn(`Node ${id} not found`)
      return
    }
    const event = node.events?.find((event) => event.name === action)
    if (!event) return

    return executeEvent(node, event, payload)
  }

  const context: RuntimeContext = {
    getNode,
    executeEvent,
    reportEventFailure,
    setAttribute,
    setProps,
    setStyle,
    setPlacement,
    registerNodeInstance,
    unregisterNodeInstance,
    registerNodeValue,
    getNodeValue,
    trigger,
    refreshNodesByDataId,
    dispatch,
  }
  return context
}
