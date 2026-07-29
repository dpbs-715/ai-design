import { canMaterialAcceptChild, getMaterialDefinition } from '@/materials'
import {
  materialSchema,
  type MaterialChildrenLayout,
  type MaterialSchema,
} from '@/schema/material.ts'
import {
  dataSourcesSchema,
  pageSchema,
  type DataSourceSchema,
  type PageRootSchema,
  type PageSchema,
} from '@/schema/page.ts'
import {
  publicModuleSchema,
  type ModuleExpression,
  type PublicModuleSchema,
} from '@/schema/module.ts'
import { z } from 'zod'

export interface SchemaValidationIssue {
  path: PropertyKey[]
  message: string
}

export type SchemaParseResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      issues: SchemaValidationIssue[]
    }

function fromZodError(error: z.ZodError): SchemaValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }))
}

function asParsedSchema<T>(data: unknown): T {
  // Zod has already validated the value. This central cast compensates for the
  // project's non-strict TypeScript config treating required object keys as optional.
  return data as T
}

function validateMaterialTree(
  children: MaterialSchema[],
  parent?: MaterialSchema | PageRootSchema,
  usedIds = new Map<string, PropertyKey[]>(),
  childrenPath: PropertyKey[] = [],
): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = []

  children.forEach((child, index) => {
    const nodePath = [...childrenPath, index]
    const previousPath = usedIds.get(child.id)

    if (previousPath) {
      issues.push({
        path: [...nodePath, 'id'],
        message: `节点 id “${child.id}” 与 ${previousPath.join('.')} 重复`,
      })
    } else {
      usedIds.set(child.id, [...nodePath, 'id'])
    }

    if (!getMaterialDefinition(child.type)) {
      issues.push({
        path: [...nodePath, 'type'],
        message: `未注册的物料类型 “${child.type}”`,
      })
    }

    const definition = getMaterialDefinition(child.type)
    if (definition?.validationSchema) {
      const result = definition.validationSchema.safeParse(child)
      if (!result.success) {
        issues.push(
          ...result.error.issues.map((issue) => ({
            path: [...nodePath, ...issue.path],
            message: issue.message,
          })),
        )
      }
    }

    if (definition) {
      const materialPlacement = definition.capability?.roles.includes('form-item')
        ? 'form-item'
        : 'absolute'
      if (child.placement.type !== materialPlacement) {
        issues.push({
          path: [...nodePath, 'placement', 'type'],
          message:
            materialPlacement === 'form-item'
              ? '该物料必须使用表单项布局'
              : '该物料必须使用绝对布局',
        })
      }
    }

    if (parent && !canMaterialAcceptChild(parent, child)) {
      issues.push({
        path: nodePath,
        message: `“${parent.name}” 不能包含 “${child.name}”`,
      })
    }

    if (parent) {
      const expectedPlacement = getExpectedChildPlacement(parent)
      if (child.placement.type !== expectedPlacement) {
        issues.push({
          path: [...nodePath, 'placement', 'type'],
          message:
            expectedPlacement === 'absolute'
              ? '当前父节点只接收绝对布局节点'
              : '当前父节点只接收表单项布局节点',
        })
      }
    }

    if (definition?.capability?.kind !== 'container' && child.children.length) {
      issues.push({
        path: [...nodePath, 'children'],
        message: '非容器节点的 children 必须为空数组',
      })
    }

    if (definition?.capability?.kind === 'container') {
      const expectedLayout = definition.capability.accepts?.includes('form-item')
        ? 'form-grid'
        : 'absolute'
      if (child.childrenLayout?.type !== expectedLayout) {
        issues.push({
          path: [...nodePath, 'childrenLayout'],
          message:
            expectedLayout === 'form-grid'
              ? '该容器必须使用表单栅格布局'
              : '该容器必须使用绝对子节点布局',
        })
      }
    } else if (child.childrenLayout !== undefined) {
      issues.push({
        path: [...nodePath, 'childrenLayout'],
        message: '非容器节点不能声明 childrenLayout',
      })
    }

    issues.push(...validateMaterialTree(child.children, child, usedIds, [...nodePath, 'children']))
  })

  return issues
}

function getExpectedChildPlacement(
  parent: MaterialSchema | PageRootSchema,
): MaterialSchema['placement']['type'] {
  if (parent.type === 'page-root') return 'absolute'
  const childrenLayout: MaterialChildrenLayout | undefined = (parent as MaterialSchema)
    .childrenLayout
  return childrenLayout?.type === 'form-grid' ? 'form-item' : 'absolute'
}

export function parseMaterialSchema(input: unknown): SchemaParseResult<MaterialSchema> {
  const result = materialSchema.safeParse(input)
  if (!result.success) {
    return { success: false, issues: fromZodError(result.error) }
  }

  const data = asParsedSchema<MaterialSchema>(result.data)
  const issues = validateMaterialTree([data])
  return issues.length ? { success: false, issues } : { success: true, data }
}

const materialNodesSchema = z.array(materialSchema)

export function parseMaterialNodesSchema(input: unknown): SchemaParseResult<MaterialSchema[]> {
  const result = materialNodesSchema.safeParse(input)
  if (!result.success) {
    return { success: false, issues: fromZodError(result.error) }
  }

  const data = asParsedSchema<MaterialSchema[]>(result.data)
  const issues = validateMaterialTree(data)
  return issues.length ? { success: false, issues } : { success: true, data }
}

export function parseDataSourcesSchema(input: unknown): SchemaParseResult<DataSourceSchema[]> {
  const result = dataSourcesSchema.safeParse(input)
  if (!result.success) {
    return { success: false, issues: fromZodError(result.error) }
  }

  return {
    success: true,
    data: asParsedSchema<DataSourceSchema[]>(result.data),
  }
}

export function parsePageSchema(input: unknown): SchemaParseResult<PageSchema> {
  const result = pageSchema.safeParse(input)
  if (!result.success) {
    return { success: false, issues: fromZodError(result.error) }
  }

  const data = asParsedSchema<PageSchema>(result.data)
  const rootIdPath: PropertyKey[] = ['root', 'id']
  const issues = validateMaterialTree(
    data.root.children,
    data.root,
    new Map([[data.root.id, rootIdPath]]),
    ['root', 'children'],
  )
  return issues.length ? { success: false, issues } : { success: true, data }
}

function collectModuleExpressionInputIds(expression: ModuleExpression, inputIds: Set<string>) {
  if (expression.kind === 'input') {
    inputIds.add(expression.inputId)
    return
  }
  if (expression.kind === 'path') {
    collectModuleExpressionInputIds(expression.source, inputIds)
    return
  }
  if (expression.kind === 'call') {
    expression.arguments.forEach((argument) => collectModuleExpressionInputIds(argument, inputIds))
  }
}

export function parsePublicModuleSchema(input: unknown): SchemaParseResult<PublicModuleSchema> {
  const result = publicModuleSchema.safeParse(input)
  if (!result.success) {
    return { success: false, issues: fromZodError(result.error) }
  }

  const data = asParsedSchema<PublicModuleSchema>(result.data)
  const pageResult = parsePageSchema({
    ...data,
    id: data.moduleId,
    root: {
      ...data.root,
      type: 'page-root',
    },
  })
  if (pageResult.success === false) return pageResult

  const issues: SchemaValidationIssue[] = []
  const validateContractCollection = (
    collection: Array<{ id: string; key: string }>,
    collectionName: 'inputs' | 'outputs' | 'slots' | 'actions',
    label: string,
  ) => {
    const ids = new Set<string>()
    const keys = new Set<string>()
    collection.forEach((item, index) => {
      if (ids.has(item.id)) {
        issues.push({
          path: ['contract', collectionName, index, 'id'],
          message: `${label} id “${item.id}” 不能重复`,
        })
      }
      if (keys.has(item.key)) {
        issues.push({
          path: ['contract', collectionName, index, 'key'],
          message: `${label} key “${item.key}” 不能重复`,
        })
      }
      ids.add(item.id)
      keys.add(item.key)
    })
    return ids
  }

  const inputIds = validateContractCollection(data.contract.inputs, 'inputs', '输入')
  const outputIds = validateContractCollection(data.contract.outputs, 'outputs', '输出')
  const slotIds = validateContractCollection(data.contract.slots, 'slots', '插槽')
  const actionIds = validateContractCollection(data.contract.actions, 'actions', '动作')

  data.contract.inputs.forEach((input, index) => {
    if (new Set(input.acceptedSources).size !== input.acceptedSources.length) {
      issues.push({
        path: ['contract', 'inputs', index, 'acceptedSources'],
        message: '输入来源不能重复',
      })
    }

    const defaultValue = input.defaultValue
    if (defaultValue === undefined) return
    const valueType = input.valueType
    const valid =
      valueType.kind === 'json' ||
      valueType.kind === 'data' ||
      (valueType.kind === 'string' && typeof defaultValue === 'string') ||
      (valueType.kind === 'boolean' && typeof defaultValue === 'boolean') ||
      (valueType.kind === 'color' &&
        (typeof defaultValue === 'string' ||
          (typeof defaultValue === 'object' && defaultValue !== null))) ||
      (valueType.kind === 'number' &&
        typeof defaultValue === 'number' &&
        Number.isFinite(defaultValue) &&
        (valueType.min === undefined || defaultValue >= valueType.min) &&
        (valueType.max === undefined || defaultValue <= valueType.max) &&
        (!valueType.integer || Number.isInteger(defaultValue)))
    if (!valid) {
      issues.push({
        path: ['contract', 'inputs', index, 'defaultValue'],
        message: `默认值不符合 ${valueType.kind} 类型约束`,
      })
    }
  })

  const nodeMap = new Map<string, MaterialSchema>()
  const collectNodeIds = (nodes: MaterialSchema[]) => {
    nodes.forEach((node) => {
      nodeMap.set(node.id, node)
      collectNodeIds(node.children)
    })
  }
  collectNodeIds(data.root.children)
  const nodeIds = new Set<string>([data.root.id, ...nodeMap.keys()])

  data.wiring.values.forEach((binding, index) => {
    if (!nodeIds.has(binding.target.nodeId)) {
      issues.push({
        path: ['wiring', 'values', index, 'target', 'nodeId'],
        message: `绑定目标节点 “${binding.target.nodeId}” 不存在`,
      })
    }
    if (
      !['props.', 'style.', 'placement.'].some((prefix) => binding.target.path.startsWith(prefix))
    ) {
      issues.push({
        path: ['wiring', 'values', index, 'target', 'path'],
        message: '字段绑定只能写入 props、style 或 placement',
      })
    }
    if (
      binding.target.path === 'placement.type' ||
      binding.target.path
        .split('.')
        .some((segment) => ['__proto__', 'prototype', 'constructor'].includes(segment))
    ) {
      issues.push({
        path: ['wiring', 'values', index, 'target', 'path'],
        message: '字段绑定路径包含不可写入的结构字段',
      })
    }
    const referencedInputIds = new Set<string>()
    collectModuleExpressionInputIds(binding.expression, referencedInputIds)
    referencedInputIds.forEach((inputId) => {
      if (!inputIds.has(inputId)) {
        issues.push({
          path: ['wiring', 'values', index, 'expression'],
          message: `绑定引用的输入 “${inputId}” 不存在`,
        })
      }
    })
  })

  data.wiring.outputs.forEach((binding, index) => {
    if (!nodeIds.has(binding.source.nodeId)) {
      issues.push({
        path: ['wiring', 'outputs', index, 'source', 'nodeId'],
        message: `输出来源节点 “${binding.source.nodeId}” 不存在`,
      })
    }
    if (!outputIds.has(binding.outputId)) {
      issues.push({
        path: ['wiring', 'outputs', index, 'outputId'],
        message: `输出 “${binding.outputId}” 未在 contract 中声明`,
      })
    }
  })

  data.wiring.actions.forEach((binding, index) => {
    if (!actionIds.has(binding.actionId)) {
      issues.push({
        path: ['wiring', 'actions', index, 'actionId'],
        message: `动作 “${binding.actionId}” 未在 contract 中声明`,
      })
    }
    binding.targets.forEach((target, targetIndex) => {
      if (!nodeIds.has(target.nodeId)) {
        issues.push({
          path: ['wiring', 'actions', index, 'targets', targetIndex, 'nodeId'],
          message: `动作目标节点 “${target.nodeId}” 不存在`,
        })
      }
    })
  })

  data.contract.slots.forEach((slot, index) => {
    const container = nodeMap.get(slot.containerNodeId)
    if (!container) {
      issues.push({
        path: ['contract', 'slots', index, 'containerNodeId'],
        message: `插槽容器节点 “${slot.containerNodeId}” 不存在`,
      })
      return
    }
    if (getMaterialDefinition(container.type)?.capability?.kind !== 'container') {
      issues.push({
        path: ['contract', 'slots', index, 'containerNodeId'],
        message: '插槽只能挂载到容器物料',
      })
    }
  })

  data.wiring.slots.forEach((binding, index) => {
    if (!slotIds.has(binding.slotId)) {
      issues.push({
        path: ['wiring', 'slots', index, 'slotId'],
        message: `插槽 “${binding.slotId}” 未在 contract 中声明`,
      })
    }
    if (!nodeIds.has(binding.containerNodeId)) {
      issues.push({
        path: ['wiring', 'slots', index, 'containerNodeId'],
        message: `插槽容器节点 “${binding.containerNodeId}” 不存在`,
      })
    }
  })

  return issues.length ? { success: false, issues } : { success: true, data }
}

export function formatSchemaValidationIssue(issue: SchemaValidationIssue | undefined) {
  if (!issue) return 'Schema 校验失败'

  const path = issue.path.length ? issue.path.join('.') : 'Schema'
  return `${path}: ${issue.message}`
}
