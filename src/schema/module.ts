import {
  dataSourcesSchema,
  pageRootSchema,
  renderThemeSchema,
  type DataSourceSchema,
  type PageRootSchema,
  type PageSchema,
} from '@/schema/page.ts'
import { extensibleObject, jsonDataSchema } from '@/schema/material.ts'
import type { RenderThemeConfig } from '@/theme/renderTheme.ts'
import { z } from 'zod'

export const MODULE_SCHEMA_VERSION = 1
export const MODULE_DRAFT_VERSION = 'draft'

export const moduleInputSourceKindSchema = z.enum([
  'literal',
  'page-variable',
  'data-source',
  'expression',
])

export type ModuleInputSourceKind = z.infer<typeof moduleInputSourceKindSchema>

export const moduleValueTypeSchema = z
  .discriminatedUnion('kind', [
    extensibleObject({
      kind: z.literal('string'),
    }),
    extensibleObject({
      kind: z.literal('number'),
      min: z.number().finite().optional(),
      max: z.number().finite().optional(),
      integer: z.boolean().optional(),
    }),
    extensibleObject({
      kind: z.literal('boolean'),
    }),
    extensibleObject({
      kind: z.literal('color'),
    }),
    extensibleObject({
      kind: z.literal('json'),
    }),
    extensibleObject({
      kind: z.literal('data'),
    }),
  ])
  .superRefine((value, context) => {
    if (
      value.kind === 'number' &&
      value.min !== undefined &&
      value.max !== undefined &&
      value.min > value.max
    ) {
      context.addIssue({
        code: 'custom',
        path: ['max'],
        message: '最大值不能小于最小值',
      })
    }
  })

export type ModuleValueType =
  | { kind: 'string' }
  | { kind: 'number'; min?: number; max?: number; integer?: boolean }
  | { kind: 'boolean' }
  | { kind: 'color' }
  | { kind: 'json' }
  | { kind: 'data' }

export const moduleInputSchema = extensibleObject({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  valueType: moduleValueTypeSchema,
  acceptedSources: z.array(moduleInputSourceKindSchema).min(1),
  defaultValue: jsonDataSchema.optional(),
  required: z.boolean().optional(),
  editor: extensibleObject({
    component: z.string().min(1),
  }).optional(),
})

export const moduleOutputSchema = extensibleObject({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  payloadType: moduleValueTypeSchema,
})

export const moduleSlotSchema = extensibleObject({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  containerNodeId: z.string().min(1),
  acceptedMaterialTypes: z.array(z.string().min(1)),
})

export const moduleActionSchema = extensibleObject({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
})

export const moduleContractSchema = extensibleObject({
  inputs: z.array(moduleInputSchema),
  outputs: z.array(moduleOutputSchema),
  slots: z.array(moduleSlotSchema),
  actions: z.array(moduleActionSchema),
})

export interface ModuleInputSchema {
  id: string
  key: string
  label: string
  valueType: ModuleValueType
  acceptedSources: ModuleInputSourceKind[]
  defaultValue?: any
  required?: boolean
  editor?: {
    component: string
  }
}

export interface ModuleOutputSchema {
  id: string
  key: string
  label: string
  payloadType: ModuleValueType
}

export interface ModuleSlotSchema {
  id: string
  key: string
  label: string
  containerNodeId: string
  acceptedMaterialTypes: string[]
}

export interface ModuleActionSchema {
  id: string
  key: string
  label: string
}

export interface ModuleContractSchema {
  inputs: ModuleInputSchema[]
  outputs: ModuleOutputSchema[]
  slots: ModuleSlotSchema[]
  actions: ModuleActionSchema[]
}

export type ModuleExpression =
  | { kind: 'input'; inputId: string }
  | { kind: 'literal'; value: unknown }
  | { kind: 'path'; source: ModuleExpression; path: string }
  | {
      kind: 'call'
      operator: 'template' | 'clamp' | 'equals' | 'if' | 'add'
      arguments: ModuleExpression[]
    }

export const moduleExpressionSchema = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('input'),
      inputId: z.string().min(1),
    }),
    z.object({
      kind: z.literal('literal'),
      value: jsonDataSchema,
    }),
    z.object({
      kind: z.literal('path'),
      source: moduleExpressionSchema,
      path: z.string().min(1),
    }),
    z.object({
      kind: z.literal('call'),
      operator: z.enum(['template', 'clamp', 'equals', 'if', 'add']),
      arguments: z.array(moduleExpressionSchema),
    }),
  ]),
) as z.ZodType<ModuleExpression>

export const moduleValueBindingSchema = extensibleObject({
  id: z.string().min(1),
  target: extensibleObject({
    nodeId: z.string().min(1),
    path: z.string().min(1),
  }),
  expression: moduleExpressionSchema,
})

export const moduleOutputBindingSchema = extensibleObject({
  source: extensibleObject({
    nodeId: z.string().min(1),
    event: z.string().min(1),
  }),
  outputId: z.string().min(1),
})

export const moduleActionBindingSchema = extensibleObject({
  actionId: z.string().min(1),
  targets: z.array(
    extensibleObject({
      nodeId: z.string().min(1),
      action: z.string().min(1),
    }),
  ),
})

export const moduleSlotBindingSchema = extensibleObject({
  slotId: z.string().min(1),
  containerNodeId: z.string().min(1),
})

export const moduleWiringSchema = extensibleObject({
  values: z.array(moduleValueBindingSchema),
  outputs: z.array(moduleOutputBindingSchema),
  actions: z.array(moduleActionBindingSchema),
  slots: z.array(moduleSlotBindingSchema),
})

export interface ModuleValueBindingSchema {
  id: string
  target: {
    nodeId: string
    path: string
  }
  expression: ModuleExpression
}

export interface ModuleOutputBindingSchema {
  source: {
    nodeId: string
    event: string
  }
  outputId: string
}

export interface ModuleActionBindingSchema {
  actionId: string
  targets: Array<{
    nodeId: string
    action: string
  }>
}

export interface ModuleSlotBindingSchema {
  slotId: string
  containerNodeId: string
}

export interface ModuleWiringSchema {
  values: ModuleValueBindingSchema[]
  outputs: ModuleOutputBindingSchema[]
  actions: ModuleActionBindingSchema[]
  slots: ModuleSlotBindingSchema[]
}

export const moduleRootSchema = pageRootSchema.extend({
  type: z.literal('module-root'),
  props: extensibleObject({
    clipContent: z.boolean().optional(),
  }),
})

export interface ModuleRootSchema extends Omit<PageRootSchema, 'type' | 'props'> {
  type: 'module-root'
  props: PageRootSchema['props'] & {
    clipContent?: boolean
  }
}

export const publicModuleSchema = extensibleObject({
  schemaVersion: z.literal(MODULE_SCHEMA_VERSION),
  kind: z.literal('public-module'),
  moduleId: z.string().min(1),
  version: z.string().min(1),
  theme: renderThemeSchema,
  root: moduleRootSchema,
  dataSources: dataSourcesSchema,
  contract: moduleContractSchema,
  wiring: moduleWiringSchema,
})

export interface PublicModuleSchema {
  schemaVersion: typeof MODULE_SCHEMA_VERSION
  kind: 'public-module'
  moduleId: string
  version: string
  theme: RenderThemeConfig
  root: ModuleRootSchema
  dataSources: DataSourceSchema[]
  contract: ModuleContractSchema
  wiring: ModuleWiringSchema
  extensions?: Record<string, any>
}

export interface PublicModuleVersionRecord {
  version: string
  schema: PublicModuleSchema
  publishedAt: string
}

export function getNextPublicModuleVersion(versions: PublicModuleVersionRecord[]) {
  const latestVersionNumber = versions.reduce((latest, version) => {
    const versionNumber = /^v(\d+)$/.exec(version.version)?.[1]
    return versionNumber ? Math.max(latest, Number(versionNumber)) : latest
  }, 0)
  return `v${latestVersionNumber + 1}`
}

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJson)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .map((key) => [key, canonicalizeJson((value as Record<string, unknown>)[key])]),
  )
}

export function isSamePublicModuleContent(left: PublicModuleSchema, right: PublicModuleSchema) {
  const { version: _leftVersion, ...leftContent } = left
  const { version: _rightVersion, ...rightContent } = right
  return (
    JSON.stringify(canonicalizeJson(leftContent)) === JSON.stringify(canonicalizeJson(rightContent))
  )
}

export type ModuleInstanceInputValue =
  | { kind: 'literal'; value: unknown }
  | { kind: 'page-variable'; variableId: string }
  | { kind: 'data-source'; sourceId: string; path?: string }
  | { kind: 'expression'; expression: ModuleExpression }

const moduleInstanceInputValueSchema = z.discriminatedUnion('kind', [
  extensibleObject({
    kind: z.literal('literal'),
    value: jsonDataSchema,
  }),
  extensibleObject({
    kind: z.literal('page-variable'),
    variableId: z.string().min(1),
  }),
  extensibleObject({
    kind: z.literal('data-source'),
    sourceId: z.string().min(1),
    path: z.string().optional(),
  }),
  extensibleObject({
    kind: z.literal('expression'),
    expression: moduleExpressionSchema,
  }),
])

export const projectModuleInstancePropsSchema = extensibleObject({
  moduleId: z.string().min(1),
  version: z.string().min(1),
  updatePolicy: z.enum(['manual', 'latest']),
  inputs: z.record(z.string(), moduleInstanceInputValueSchema),
  outputHandlers: z.record(z.string(), z.array(jsonDataSchema)),
})

const legacyProjectModuleInstancePropsSchema = extensibleObject({
  moduleId: z.string().min(1),
  moduleVersion: z.string().min(1),
  availableVersion: z.string().min(1),
  title: z.string(),
  displayCount: z.number(),
  parameters: z.record(z.string(), jsonDataSchema),
})

export const projectModuleInstanceNodeSchema = z
  .object({
    type: z.literal('project-module-instance'),
    props: z.union([projectModuleInstancePropsSchema, legacyProjectModuleInstancePropsSchema]),
  })
  .passthrough()

export interface ProjectModuleInstanceProps {
  moduleId: string
  version: string
  updatePolicy: 'manual' | 'latest'
  inputs: Record<string, ModuleInstanceInputValue>
  outputHandlers: Record<string, unknown[]>
}

export interface ModuleEditorPage extends PageSchema {
  kind: 'public-module-editor'
  moduleId: string
  version: typeof MODULE_DRAFT_VERSION
  contract: ModuleContractSchema
  wiring: ModuleWiringSchema
}

export function createEmptyModuleContract(): ModuleContractSchema {
  return {
    inputs: [],
    outputs: [],
    slots: [],
    actions: [],
  }
}

export function createEmptyModuleWiring(): ModuleWiringSchema {
  return {
    values: [],
    outputs: [],
    actions: [],
    slots: [],
  }
}

export function toModuleEditorPage(schema: PublicModuleSchema): ModuleEditorPage {
  return {
    ...schema,
    id: schema.moduleId,
    kind: 'public-module-editor',
    version: MODULE_DRAFT_VERSION,
    root: {
      ...schema.root,
      type: 'page-root',
    },
  }
}

export function fromModuleEditorPage(
  page: PageSchema,
  previousSchema: PublicModuleSchema,
): PublicModuleSchema {
  const editorPage = page as ModuleEditorPage
  return {
    ...previousSchema,
    schemaVersion: MODULE_SCHEMA_VERSION,
    kind: 'public-module',
    moduleId: previousSchema.moduleId,
    version: MODULE_DRAFT_VERSION,
    theme: page.theme,
    root: {
      ...page.root,
      type: 'module-root',
    },
    dataSources: page.dataSources,
    contract: editorPage.contract ?? previousSchema.contract,
    wiring: editorPage.wiring ?? previousSchema.wiring,
  }
}

export function getModuleEditorContract(page: PageSchema) {
  return (page as ModuleEditorPage).contract
}

export function getModuleEditorWiring(page: PageSchema) {
  return (page as ModuleEditorPage).wiring
}

export function createModuleInstanceInputs(
  schema: PublicModuleSchema,
  currentInputs: Record<string, ModuleInstanceInputValue> = {},
) {
  return Object.fromEntries(
    schema.contract.inputs.map((input) => [
      input.id,
      currentInputs[input.id] ?? {
        kind: 'literal',
        value: input.defaultValue ?? null,
      },
    ]),
  )
}

export function normalizeProjectModuleInstanceProps(
  value: Record<string, any>,
): ProjectModuleInstanceProps {
  if (
    typeof value.version === 'string' &&
    (value.updatePolicy === 'manual' || value.updatePolicy === 'latest') &&
    value.inputs &&
    typeof value.inputs === 'object'
  ) {
    return {
      moduleId: String(value.moduleId ?? ''),
      version: value.version,
      updatePolicy: value.updatePolicy,
      inputs: value.inputs,
      outputHandlers: value.outputHandlers ?? {},
    }
  }

  return {
    moduleId: String(value.moduleId ?? ''),
    version: String(value.moduleVersion ?? 'v1'),
    updatePolicy: 'manual',
    inputs: {},
    outputHandlers: {},
  }
}
