import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { designProposalSchema } from '../../core/operations/schemas.js'
import { designIntentSchema } from '../../graphs/page-design/schemas.js'
import { toMfjsSchema } from '../mfjs.js'

type JsonSchema = Record<string, any>

/** MFJS 不认的关键字留下来会让整份 schema 被静默忽略,所以逐个查。 */
const BANNED = [
  '$schema',
  'title',
  'default',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'propertyNames',
  'format',
  'pattern',
]

/** 按 MFJS 的两条硬性规则 + strict 的必填要求遍历整棵 schema,返回全部问题。 */
function findViolations(node: unknown, path = '$'): string[] {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap((item, i) => findViolations(item, `${path}[${i}]`))

  const schema = node as JsonSchema
  const problems: string[] = []
  const branches: JsonSchema[] | undefined = schema.anyOf ?? schema.oneOf
  const isBranchParent = Array.isArray(branches)

  for (const keyword of BANNED) {
    if (keyword in schema) problems.push(`${path}: 残留 ${keyword}`)
  }

  // 规则 1:每个子 schema 必须有 type。$ref 与分支父级除外。
  if (!('type' in schema) && !('$ref' in schema) && !isBranchParent && path !== '$') {
    problems.push(`${path}: 缺 type`)
  }

  // 规则 2:anyOf/oneOf 的 type 只能在子项上。
  if (isBranchParent) {
    if ('type' in schema) problems.push(`${path}: 分支父级不该有 type`)
    branches.forEach((branch, i) => {
      if (!('type' in branch) && !('$ref' in branch)) problems.push(`${path}.分支[${i}]: 缺 type`)
    })
    problems.push(...branches.flatMap((b, i) => findViolations(b, `${path}.分支[${i}]`)))
  }

  if (schema.properties) {
    const props = Object.keys(schema.properties)
    const required: string[] = schema.required ?? []
    const missing = props.filter((p) => !required.includes(p))
    // strict 要求全部属性必填,「没有值」靠可空联合表达。
    if (missing.length > 0) problems.push(`${path}: 未进 required — ${missing.join(',')}`)
    if (schema.additionalProperties === undefined) problems.push(`${path}: 缺 additionalProperties`)
    problems.push(
      ...Object.entries(schema.properties).flatMap(([k, v]) => findViolations(v, `${path}.${k}`)),
    )
  }
  if (schema.items) problems.push(...findViolations(schema.items, `${path}.items`))
  if (schema.$defs) {
    problems.push(
      ...Object.entries(schema.$defs).flatMap(([k, v]) => findViolations(v, `$defs.${k}`)),
    )
  }
  return problems
}

describe('toMfjsSchema — 项目实际使用的 schema', () => {
  /**
   * 这两份 schema 就是发给端点的东西。不合规时 Kimi 不报错 —— 200、无 warning、
   * 只是静默忽略 schema,生成退回无约束状态。所以只能在这里挡。
   */
  it('designIntentSchema 符合 MFJS', () => {
    expect(findViolations(toMfjsSchema(designIntentSchema))).toEqual([])
  })

  it('designProposalSchema 符合 MFJS', () => {
    expect(findViolations(toMfjsSchema(designProposalSchema))).toEqual([])
  })

  it('add-node 的 node 是对象类型且不含 $ref —— z.json() 展开后拿不到单一 type', () => {
    const schema = toMfjsSchema(designProposalSchema)
    const variants = schema.properties.operations.items.anyOf ?? schema.properties.operations.items.oneOf
    const addNode = variants.find((v: JsonSchema) => v.properties?.type?.const === 'add-node')

    expect(addNode.properties.node).toMatchObject({ type: 'object', additionalProperties: true })
    expect(JSON.stringify(addNode)).not.toContain('$ref')
  })

  it('可选的 index 变成可空联合并进入 required', () => {
    const schema = toMfjsSchema(designProposalSchema)
    const variants = schema.properties.operations.items.anyOf ?? schema.properties.operations.items.oneOf
    const addNode = variants.find((v: JsonSchema) => v.properties?.type?.const === 'add-node')

    // strict 下「没有值」只能靠可空联合表达,不能靠字段缺席。
    expect(addNode.properties.index.anyOf).toEqual([{ type: 'integer' }, { type: 'null' }])
    expect(addNode.required).toContain('index')
  })

  /** $ref 是 MFJS 里兼容性最不确定的一块,能不用就不用。 */
  it('整份 schema 不含 $ref 与 $defs', () => {
    const text = JSON.stringify(toMfjsSchema(designProposalSchema))

    expect(text).not.toContain('$ref')
    expect(text).not.toContain('$defs')
  })
})

describe('toMfjsSchema — 清洗规则', () => {
  it('丢掉 MFJS 不认的关键字', () => {
    const result = toMfjsSchema(z.object({ name: z.string().min(2).max(8) }))

    expect(result.properties.name).toEqual({ type: 'string' })
    expect(result).not.toHaveProperty('$schema')
  })

  it('对象补齐 additionalProperties:false —— strict 靠它禁止模型编造字段', () => {
    expect(toMfjsSchema(z.object({ a: z.string() })).additionalProperties).toBe(false)
  })

  it('把父级 type 下沉进分支子项,父级自身不留 type', () => {
    const result = toMfjsSchema(
      z.object({ value: z.union([z.literal('a'), z.literal('b')]) }),
    )
    const value = result.properties.value
    const branches = value.anyOf ?? value.oneOf

    if (branches) {
      expect(value).not.toHaveProperty('type')
      for (const branch of branches) expect(branch).toHaveProperty('type')
    } else {
      // zod 可能把字面量联合折叠成 enum,那也是合规的。
      expect(value).toHaveProperty('type')
    }
  })

  it('嵌套对象递归清洗', () => {
    const result = toMfjsSchema(
      z.object({ outer: z.object({ inner: z.string().min(1) }) }),
    )

    expect(result.properties.outer.properties.inner).toEqual({ type: 'string' })
    expect(result.properties.outer.additionalProperties).toBe(false)
    expect(result.properties.outer.required).toEqual(['inner'])
  })
})

/**
 * schema 把可选字段转成必填 + 可空,模型就会显式返回 null。
 * 这几条钉住「zod 那边收得下 null」—— 否则清洗层和校验层会对不上。
 */
describe('可空字段与 zod 的对应', () => {
  it('operations 里的显式 null 能通过校验', () => {
    const result = designProposalSchema.safeParse({
      summary: '建表单',
      operations: [{ type: 'add-node', parentId: 'root', node: { id: 'a' }, index: null }],
    })

    expect(result.success).toBe(true)
  })

  it('update-node 的三个可选字段都收得下 null', () => {
    const result = designProposalSchema.safeParse({
      summary: '改属性',
      operations: [{ type: 'update-node', nodeId: 'a', props: null, style: null, placement: null }],
    })

    expect(result.success).toBe(true)
  })

  /** 物料模板里的 `initialValue: null` 是有意义的取值,不能被当成「没有值」丢掉。 */
  it('node 内部的 null 原样保留', () => {
    const result = designProposalSchema.parse({
      summary: 's',
      operations: [
        {
          type: 'add-node',
          parentId: 'r',
          node: { props: { initialValue: null } },
          index: null,
        },
      ],
    })
    const operation = result.operations[0]!
    if (operation.type !== 'add-node') throw new Error('期望 add-node')

    expect((operation.node as Record<string, any>).props.initialValue).toBeNull()
  })
})
