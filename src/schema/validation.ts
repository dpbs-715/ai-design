import {
  canMaterialAcceptChild,
  getMaterialDefinition,
} from '@/materials'
import {
  materialSchema,
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

    if (parent && !canMaterialAcceptChild(parent, child)) {
      issues.push({
        path: nodePath,
        message: `“${parent.name}” 不能包含 “${child.name}”`,
      })
    }

    issues.push(
      ...validateMaterialTree(
        child.children,
        child,
        usedIds,
        [...nodePath, 'children'],
      ),
    )
  })

  return issues
}

export function parseMaterialSchema(input: unknown): SchemaParseResult<MaterialSchema> {
  const result = materialSchema.safeParse(input)
  if (!result.success) {
    return { success: false, issues: fromZodError(result.error) }
  }

  const data = asParsedSchema<MaterialSchema>(result.data)
  const issues = validateMaterialTree([data])
  return issues.length
    ? { success: false, issues }
    : { success: true, data }
}

const materialNodesSchema = z.array(materialSchema)

export function parseMaterialNodesSchema(input: unknown): SchemaParseResult<MaterialSchema[]> {
  const result = materialNodesSchema.safeParse(input)
  if (!result.success) {
    return { success: false, issues: fromZodError(result.error) }
  }

  const data = asParsedSchema<MaterialSchema[]>(result.data)
  const issues = validateMaterialTree(data)
  return issues.length
    ? { success: false, issues }
    : { success: true, data }
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
  return issues.length
    ? { success: false, issues }
    : { success: true, data }
}

export function formatSchemaValidationIssue(issue: SchemaValidationIssue | undefined) {
  if (!issue) return 'Schema 校验失败'

  const path = issue.path.length ? issue.path.join('.') : 'Schema'
  return `${path}: ${issue.message}`
}
