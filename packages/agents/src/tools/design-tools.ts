import { tool } from '@langchain/core/tools'
import { formatMaterialDetail, getMaterialDetail } from '../core/catalog/catalog.js'
import {
  GET_MATERIAL_DETAIL_TOOL_DESCRIPTION,
  GET_MATERIAL_DETAIL_TOOL_NAME,
  getMaterialDetailInputSchema,
} from '../core/catalog/tool-schemas.js'

/**
 * 取单个物料的完整信息(含默认模板)。
 *
 * 这是设计阶段唯一的工具:物料清单已经静态写进 system prompt,
 * 模型不必再检索「有哪些物料」,只需要按需补体积大的模板。
 */
export const getMaterialDetailTool = tool(
  ({ type }) => {
    const detail = getMaterialDetail(type)
    if (!detail) {
      return `物料类型 “${type}” 不存在。可用类型见 system prompt 里的物料清单。`
    }
    return formatMaterialDetail(detail)
  },
  {
    name: GET_MATERIAL_DETAIL_TOOL_NAME,
    description: GET_MATERIAL_DETAIL_TOOL_DESCRIPTION,
    schema: getMaterialDetailInputSchema,
  },
)

export const designTools = [getMaterialDetailTool]
