import { z } from 'zod'

/**
 * 把 zod 生成的 JSON Schema 调整成 MFJS(Moonshot Flavored JSON Schema)。
 *
 * Kimi 的 `response_format: {type:'json_schema', strict:true}` 校验的不是标准
 * JSON Schema,而是一个更严格的子集(服务端校验器 MoonshotAI/walle)。
 * 不合规时**不报错** —— 请求照样 200、响应里也没有 `warning` 字段,只是 schema
 * 被静默忽略,生成退回无约束状态。思考模型这时会把推理写进 content,
 * 下游 JSON.parse 就崩了。这里的意义就是不让 schema 被静默丢掉。
 *
 * zod 的默认输出违反三条:
 *
 * 1. **每个子 schema 必须有 `type`。** 标准里 `type` 可选,MFJS 必填。
 * 2. **`anyOf` 的 `type` 只能在子项上,不能在父级。**
 * 3. **strict 要求所有属性都在 `required` 里** —— 「没有值」要用可空联合
 *    (`["integer","null"]`)表达,而不是靠字段缺席。
 *
 * 调整全部通过 zod 官方的 `override` 钩子完成,没有自己遍历 schema 树。
 */

/**
 * MFJS 不认的关键字。留着会让整份 schema 被静默忽略,而它们表达的约束
 * (长度、范围、默认值)本来就由 apply 阶段的 zod 校验兜底,不靠模型自觉。
 */
const UNSUPPORTED_KEYWORDS = [
  '$schema',
  'title',
  'default',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minItems',
  'maxItems',
  'pattern',
  'format',
  'propertyNames',
]

type JsonSchema = Record<string, any>

function branchesOf(node: JsonSchema): JsonSchema[] | undefined {
  if (Array.isArray(node.anyOf)) return node.anyOf
  if (Array.isArray(node.oneOf)) return node.oneOf
  return undefined
}

/** 从结构反推 `type`。推不出来就不写,让残留检查去发现。 */
function inferType(node: JsonSchema): string | undefined {
  if (node.type !== undefined) return node.type
  if (node.properties !== undefined || node.additionalProperties !== undefined) return 'object'
  if (node.items !== undefined) return 'array'
  if (node.const !== undefined) return typeof node.const
  if (Array.isArray(node.enum) && node.enum.length > 0) return typeof node.enum[0]
  return undefined
}

function applyMfjsRules({ jsonSchema }: { jsonSchema: JsonSchema }): void {
  const node = jsonSchema
  for (const keyword of UNSUPPORTED_KEYWORDS) delete node[keyword]

  const branches = branchesOf(node)
  if (branches) {
    // 规则 2:父级不留 type,分支各自带上。
    delete node.type
    // 顺带摊平嵌套分支:`判别联合 + .nullish()` 会生成 anyOf 里再套 oneOf,
    // 外层分支就没有 type 了。
    const flattened = branches.flatMap((branch) => {
      const inner = branchesOf(branch)
      return inner && Object.keys(branch).length === 1 ? inner : [branch]
    })
    for (const branch of flattened) {
      if (branch.type === undefined && branch.$ref === undefined) {
        const type = inferType(branch)
        if (type !== undefined) branch.type = type
      }
    }
    if (node.anyOf) node.anyOf = flattened
    else node.oneOf = flattened
    return
  }

  // contracts 的 `extensibleObject` 用 `.catchall(z.json())`,zod 展开成指向递归定义的
  // `$ref`。那含义就是「任意值」,布尔 true 是同样意思的更简单写法,还省掉 $ref/$defs
  // —— MFJS 里兼容性最不确定的部分。
  const extra = node.additionalProperties
  if (extra && typeof extra === 'object' && (extra.$ref || Object.keys(extra).length === 0)) {
    node.additionalProperties = true
  }

  // 规则 1:补齐 type。$ref 自带指向,不强加。
  if (node.$ref === undefined) {
    const type = inferType(node)
    if (type !== undefined) node.type = type
  }

  if (node.properties) {
    const required: string[] = node.required ?? []
    for (const [key, value] of Object.entries<JsonSchema>(node.properties)) {
      if (required.includes(key)) continue
      // 规则 3:原本可选的属性改用可空联合表达「没有值」。
      const valueBranches = branchesOf(value)
      if (valueBranches) {
        if (!valueBranches.some((branch) => branch.type === 'null')) {
          valueBranches.push({ type: 'null' })
        }
      } else if (typeof value.type === 'string') {
        value.type = [value.type, 'null']
      }
    }
    node.required = Object.keys(node.properties)
  }

  // strict 靠 additionalProperties:false 禁止模型编造 schema 之外的字段。
  if (node.type === 'object' && node.additionalProperties === undefined) {
    node.additionalProperties = false
  }
}

/**
 * zod schema → MFJS 兼容的 JSON Schema。
 *
 * 注意可选属性会被转成必填 + 可空,模型会显式返回 `null`。所以对应的 zod schema
 * 要用 `.nullish()` 而不是 `.optional()`(后者不收 null),消费方也要把 null 当作
 * 「没有值」处理 —— 见 `core/operations/apply.ts` 的 `insertAt`。
 */
export function toMfjsSchema(schema: z.ZodType): JsonSchema {
  // reused:'inline' 让复用的子 schema 直接展开,不生成 $defs。
  const result: JsonSchema = z.toJSONSchema(schema, {
    reused: 'inline',
    override: applyMfjsRules,
  })
  // $schema 是 override 跑完之后才加到根上的,只能在这里删。
  delete result.$schema
  delete result.$defs

  // 残留的 `$ref` 说明来源里有本层没预料到的结构(比如新的递归定义)。
  // 让它在这里响,总好过发出去被静默忽略 —— 那种失败要从解析错误反查回来。
  if (JSON.stringify(result).includes('$ref')) {
    throw new Error('MFJS 调整后仍残留 $ref,请检查 schema 结构(见 llm/mfjs.ts)')
  }
  return result
}
