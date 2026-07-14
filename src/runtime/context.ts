import type { MaterialSchema } from '@/schema/material.ts'
import type { PageSchema } from '@/schema/page.ts'
import { setByKeyOrPath } from '@vunio/utils'

interface RuntimeContext {
  getNode: (id: string) => MaterialSchema | undefined
  setAttribute: (id: string, key: string, value: any) => void
  setProps: (id: string, key: string, value: any) => void
  setStyle: (id: string, key: string, value: any) => void
  setLayout: (id: string, key: string, value: any) => void

  registerNodeInstance(instances: Record<string, any>): void
  trigger: (id: string, event: string, ...args: any[]) => any
  refreshNodesByDataId: (dataId: string, ...args: any[]) => void

  dispatch: (id: string, action: string, payload?: any) => any
}

export function createRuntimeContext(page: Ref<PageSchema>): RuntimeContext {
  let instanceMap = {}

  const getNode: RuntimeContext['getNode'] = (id) => {
    return page.value.nodes.find((node) => node.id === id)
  }

  const setAttribute: RuntimeContext['setAttribute'] = (id, key, value) => {
    const node = getNode(id)
    if (!node) {
      console.warn(`Node ${id} not found`)
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

  const setLayout: RuntimeContext['setLayout'] = (id, key, value) => {
    setAttribute(id, `layout.${key}`, value)
  }

  const registerNodeInstance: RuntimeContext['registerNodeInstance'] = (instances) => {
    instanceMap = instances
  }

  const trigger: RuntimeContext['trigger'] = (id, event, ...args) => {
    const instance = instanceMap[id]

    if (!instance) {
      console.warn(`Instance ${id} not found`)
      return
    }
    return instance[event]?.(...args)
  }

  const refreshNodesByDataId: RuntimeContext['refreshNodesByDataId'] = (dataId, ...args) => {
    const nodes = page.value.nodes.filter((node) => node.dataId === dataId)
    nodes.forEach((node) => {
      trigger(node.id, 'refresh', ...args)
    })
  }

  const dispatch: RuntimeContext['dispatch'] = (id, action, payload) => {
    const node = getNode(id)
    if (!node) {
      console.warn(`Node ${id} not found`)
      return
    }
    const event = node.events?.find((event) => event.name === action)
    if (event) {
      return event.handler(payload)
    }
  }

  return {
    getNode,
    setAttribute,
    setProps,
    setStyle,
    setLayout,
    registerNodeInstance,
    trigger,
    refreshNodesByDataId,
    dispatch,
  }
}
