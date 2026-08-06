import { z } from 'zod'
import { listMaterialGroupKeys } from './catalog.js'

/**
 * 物料搜索工具的输入。
 *
 * 这里只定义 name / description / schema —— 与具体 LLM SDK 无关。
 * 绑定执行逻辑由 graph 层完成,避免把 provider 依赖泄进 core。
 */
export const searchMaterialsInputSchema = z.object({
  keyword: z
    .string()
    .optional()
    .describe('物料名称、类型或用途关键词。留空则返回该分组下全部物料。'),
  group: z
    .string()
    .optional()
    .describe(`物料分组,可选值:${listMaterialGroupKeys().join(' / ')}。留空则搜索所有分组。`),
})

export type SearchMaterialsInput = z.infer<typeof searchMaterialsInputSchema>

export const SEARCH_MATERIALS_TOOL_NAME = 'search_materials'

export const SEARCH_MATERIALS_TOOL_DESCRIPTION = [
  '搜索编辑器里可用的物料,返回类型、名称、用途和容纳规则。',
  '当你需要确认某种物料是否存在、或不确定该用哪个 type 时调用它。',
  '返回结果不含默认模板 —— 确定要用哪个物料后,再用 get_material_detail 取模板。',
].join('')

export const getMaterialDetailInputSchema = z.object({
  type: z.string().min(1).describe('物料类型,例如 bar-chart、form-input。'),
})

export type GetMaterialDetailInput = z.infer<typeof getMaterialDetailInputSchema>

export const GET_MATERIAL_DETAIL_TOOL_NAME = 'get_material_detail'

export const GET_MATERIAL_DETAIL_TOOL_DESCRIPTION = [
  '取单个物料的完整信息,含创建节点用的默认模板。',
  '在生成 add-node 操作之前调用它 —— 模板给出该物料必需的 props 结构,',
  '照抄模板再改动需要的字段,比凭空写 props 可靠得多。',
].join('')
