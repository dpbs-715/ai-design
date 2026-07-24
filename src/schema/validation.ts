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

export function formatSchemaValidationIssue(issue: SchemaValidationIssue | undefined) {
  if (!issue) return 'Schema 校验失败'

  const path = issue.path.length ? issue.path.join('.') : 'Schema'
  return `${path}: ${issue.message}`
}
