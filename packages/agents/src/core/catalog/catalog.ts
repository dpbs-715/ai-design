import { materialDescriptors, materialGroups } from '@ai-design/materials'
import type { MaterialDescriptor, MaterialExposedMethod } from '@ai-design/materials'
import type { MaterialTemplate } from '@ai-design/contracts'

/** 给 LLM 看的物料摘要 —— 不含模板,用于选型。 */
export interface MaterialSummary {
  type: string
  name: string
  group: string
  description: string
  kind: 'leaf' | 'container'
  /** 该物料自身扮演的角色。 */
  roles: string[]
  /** 作为容器时接纳的子节点角色;叶子物料为 undefined。 */
  accepts?: string[]
}

/** 单个物料的完整信息 —— 含创建节点所需的模板。 */
export interface MaterialDetail extends MaterialSummary {
  template: MaterialTemplate
  /**
   * 事件脚本可通过 `$context.trigger` 调用的实例方法。
   * 纯展示类物料没有暴露方法,该字段为 undefined。
   */
  exposedMethods?: readonly MaterialExposedMethod[]
}

export interface MaterialSearchQuery {
  keyword?: string
  group?: string
}

/**
 * 按 `type` 索引的物料表。
 *
 * 注意:同一个 `type` 可能对应多个描述符(annotation-frame 有四个预设),
 * 但 agent 是按 `type` 创建节点的,所以这里每个 type 只保留**第一个**描述符。
 * 预设之间只有默认样式不同,capability 与 type 完全一致,不影响选型和校验。
 */
const descriptorByType = new Map<string, MaterialDescriptor>()
for (const descriptor of materialDescriptors) {
  if (!descriptorByType.has(descriptor.type)) {
    descriptorByType.set(descriptor.type, descriptor)
  }
}

function toSummary(descriptor: MaterialDescriptor): MaterialSummary {
  return {
    type: descriptor.type,
    name: descriptor.name,
    group: descriptor.group,
    description: descriptor.description,
    kind: descriptor.capability.kind,
    roles: descriptor.capability.roles,
    ...(descriptor.capability.accepts ? { accepts: descriptor.capability.accepts } : {}),
  }
}

/** 所有可用物料的摘要,每个 type 一条。 */
export function listMaterialSummaries(): MaterialSummary[] {
  return [...descriptorByType.values()].map(toSummary)
}

/**
 * 按关键词或分组搜索物料。关键词匹配 type / 名称 / 用途说明,不区分大小写。
 * 两个条件都为空时返回全部。
 */
export function searchMaterials(query: MaterialSearchQuery = {}): MaterialSummary[] {
  const keyword = query.keyword?.trim().toLowerCase()
  const group = query.group?.trim()

  return listMaterialSummaries().filter((summary) => {
    if (group && summary.group !== group) return false
    if (!keyword) return true
    return (
      summary.type.toLowerCase().includes(keyword) ||
      summary.name.toLowerCase().includes(keyword) ||
      summary.description.toLowerCase().includes(keyword)
    )
  })
}

/** 取单个物料的完整信息,含模板。type 不存在时返回 undefined。 */
export function getMaterialDetail(type: string): MaterialDetail | undefined {
  const descriptor = descriptorByType.get(type)
  if (!descriptor) return undefined
  return {
    ...toSummary(descriptor),
    template: descriptor.template,
    exposedMethods: descriptor.exposedMethods,
  }
}

/** 所有分组的 key,顺序与物料面板一致。 */
export function listMaterialGroupKeys(): string[] {
  return materialGroups.map((group) => group.key)
}

function formatSummary(summary: MaterialSummary): string {
  const containment =
    summary.kind === 'container'
      ? `容器,可容纳=[${summary.accepts?.join(', ') ?? ''}]`
      : '叶子,不能有子节点'
  return [
    `- ${summary.type}(${summary.name}) 分组=${summary.group} ${containment} 自身角色=[${summary.roles.join(', ')}]`,
    `  ${summary.description}`,
  ].join('\n')
}

/** 把物料摘要渲染成 prompt 文本。 */
export function formatMaterialSummaries(summaries: MaterialSummary[]): string {
  if (summaries.length === 0) return '(没有匹配的物料)'
  return summaries.map(formatSummary).join('\n')
}

/**
 * 把单个物料的完整信息渲染成工具返回文本。
 *
 * 模板是 `MaterialTemplate`,不是节点 —— 它按约定省略 `id` 和 `children`。
 * 这里必须把「省略了什么」写清楚,否则模型照抄模板就会产出缺字段的节点。
 */
export function formatMaterialDetail(detail: MaterialDetail): string {
  const lines = [
    formatSummary(detail),
    '  默认模板(创建节点时以此为基础):',
    `  ${JSON.stringify(detail.template)}`,
    '  模板省略了两个节点必填字段,照抄时要自己补:',
    '  - id:全局唯一,页面里已有的 id 不能重用。',
    '  - children:数组。叶子物料和空容器都写 []。',
    '  events 若要保留,每一项都要带齐 type/name/code(code 可以是空串);不需要事件就写 []。',
  ]

  if (detail.exposedMethods && detail.exposedMethods.length > 0) {
    lines.push('  事件脚本可通过 $context.trigger 调用的方法:')
    for (const method of detail.exposedMethods) {
      lines.push(`  - ${method.signature}  // ${method.description}`)
    }
  }

  return lines.join('\n')
}
