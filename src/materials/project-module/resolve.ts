import type { DataSourceSchema } from '@/schema/page.ts'
import type { MaterialSchema } from '@/schema/material.ts'
import {
  type ModuleExpression,
  type ModuleInputSchema,
  type ModuleInstanceInputValue,
  type PublicModuleSchema,
} from '@/schema/module.ts'
import { deepClone, getByKeyOrPath, setByKeyOrPath } from '@vunio/utils'
import type { InjectionKey } from 'vue'

export const moduleRenderPathKey: InjectionKey<string[]> = Symbol('moduleRenderPath')

function resolveDataSourceValue(
  input: Extract<ModuleInstanceInputValue, { kind: 'data-source' }>,
  dataSources: DataSourceSchema[],
) {
  const source = dataSources.find((candidate) => candidate.id === input.sourceId)
  if (!source) return undefined
  return input.path ? getByKeyOrPath(source.data, input.path) : source.data
}

function isInputValueCompatible(input: ModuleInputSchema, value: unknown) {
  if (value === undefined) return false
  if (input.valueType.kind === 'json' || input.valueType.kind === 'data') return true
  if (input.valueType.kind === 'string') return typeof value === 'string'
  if (input.valueType.kind === 'boolean') return typeof value === 'boolean'
  if (input.valueType.kind === 'color') {
    return typeof value === 'string' || (typeof value === 'object' && value !== null)
  }
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    (input.valueType.min === undefined || value >= input.valueType.min) &&
    (input.valueType.max === undefined || value <= input.valueType.max) &&
    (!input.valueType.integer || Number.isInteger(value))
  )
}

function evaluateExpression(
  expression: ModuleExpression,
  getInputValue: (inputId: string) => unknown,
): unknown {
  if (expression.kind === 'input') return getInputValue(expression.inputId)
  if (expression.kind === 'literal') return expression.value
  if (expression.kind === 'path') {
    const source = evaluateExpression(expression.source, getInputValue)
    return getByKeyOrPath(source, expression.path)
  }

  const args = expression.arguments.map((argument) => evaluateExpression(argument, getInputValue))
  if (expression.operator === 'template') return args.map((value) => String(value ?? '')).join('')
  if (expression.operator === 'equals') return args[0] === args[1]
  if (expression.operator === 'if') return args[0] ? args[1] : args[2]
  if (expression.operator === 'add') {
    return args.reduce<number>((total, value) => total + Number(value ?? 0), 0)
  }
  if (expression.operator === 'clamp') {
    const value = Number(args[0] ?? 0)
    const min = Number(args[1] ?? Number.NEGATIVE_INFINITY)
    const max = Number(args[2] ?? Number.POSITIVE_INFINITY)
    return Math.min(Math.max(value, min), max)
  }
}

function resolveInputValues(
  schema: PublicModuleSchema,
  inputs: Record<string, ModuleInstanceInputValue>,
  dataSources: DataSourceSchema[],
) {
  const values = new Map<string, unknown>()
  const inputsById = new Map(schema.contract.inputs.map((input) => [input.id, input]))
  const resolvingInputIds = new Set<string>()

  const resolveInputValue = (inputId: string): unknown => {
    if (values.has(inputId)) return values.get(inputId)
    const input = inputsById.get(inputId)
    if (!input) return undefined
    if (resolvingInputIds.has(inputId)) return input.defaultValue
    resolvingInputIds.add(inputId)

    const source = inputs[input.id]
    let value: unknown
    if (!source || !input.acceptedSources.includes(source.kind)) {
      value = input.defaultValue
    } else if (source.kind === 'literal') {
      value = source.value
    } else if (source.kind === 'data-source') {
      value = resolveDataSourceValue(source, dataSources)
    } else if (source.kind === 'expression') {
      value = evaluateExpression(source.expression, resolveInputValue)
    } else {
      value = input.defaultValue
    }
    if (!isInputValueCompatible(input, value)) value = input.defaultValue
    resolvingInputIds.delete(inputId)
    values.set(inputId, value)
    return value
  }

  schema.contract.inputs.forEach((input) => resolveInputValue(input.id))

  return values
}

function namespaceModuleNodes(nodes: MaterialSchema[], instanceId: string) {
  const idMap = new Map<string, string>()
  const collectIds = (candidates: MaterialSchema[]) => {
    candidates.forEach((node) => {
      idMap.set(node.id, `${instanceId}::${node.id}`)
      collectIds(node.children)
    })
  }
  collectIds(nodes)

  const mapNodes = (candidates: MaterialSchema[]): MaterialSchema[] =>
    candidates.map((node) => {
      const nextNode = {
        ...node,
        id: idMap.get(node.id) ?? `${instanceId}::${node.id}`,
        children: mapNodes(node.children),
      }
      nextNode.dataQuery?.params.forEach((param) => {
        param.source.nodeId = idMap.get(param.source.nodeId) ?? param.source.nodeId
      })
      return nextNode
    })

  return mapNodes(nodes)
}

export function resolvePublicModuleContent(
  schema: PublicModuleSchema,
  instanceId: string,
  inputs: Record<string, ModuleInstanceInputValue>,
  pageDataSources: DataSourceSchema[],
) {
  const root = deepClone(schema.root)
  const nodeMap = new Map<string, MaterialSchema>()
  const collectNodes = (nodes: MaterialSchema[]) => {
    nodes.forEach((node) => {
      nodeMap.set(node.id, node)
      collectNodes(node.children)
    })
  }
  collectNodes(root.children)

  const inputValues = resolveInputValues(schema, inputs, pageDataSources)
  schema.wiring.values.forEach((binding) => {
    const target = binding.target.nodeId === root.id ? root : nodeMap.get(binding.target.nodeId)
    if (!target) return
    setByKeyOrPath(
      target,
      binding.target.path,
      deepClone(evaluateExpression(binding.expression, (inputId) => inputValues.get(inputId))),
    )
  })

  return {
    root,
    nodes: namespaceModuleNodes(root.children, instanceId),
    dataSources: schema.dataSources,
  }
}
