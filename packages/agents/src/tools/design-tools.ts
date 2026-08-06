import { tool } from '@langchain/core/tools'
import {
  formatMaterialDetail,
  formatMaterialSummaries,
  getMaterialDetail,
  searchMaterials,
} from '../core/catalog/catalog.js'
import {
  GET_MATERIAL_DETAIL_TOOL_DESCRIPTION,
  GET_MATERIAL_DETAIL_TOOL_NAME,
  SEARCH_MATERIALS_TOOL_DESCRIPTION,
  SEARCH_MATERIALS_TOOL_NAME,
  getMaterialDetailInputSchema,
  searchMaterialsInputSchema,
} from '../core/catalog/tool-schemas.js'

/**
 * 物料搜索工具。物料清单是静态数据,不需要外部依赖 —— 直接查注册表。
 */
export const searchMaterialsTool = tool(
  ({ keyword, group }) => formatMaterialSummaries(searchMaterials({ keyword, group })),
  {
    name: SEARCH_MATERIALS_TOOL_NAME,
    description: SEARCH_MATERIALS_TOOL_DESCRIPTION,
    schema: searchMaterialsInputSchema,
  },
)

/** 取单个物料的完整信息(含默认模板)。 */
export const getMaterialDetailTool = tool(
  ({ type }) => {
    const detail = getMaterialDetail(type)
    if (!detail) {
      return `物料类型 “${type}” 不存在。先用 ${SEARCH_MATERIALS_TOOL_NAME} 查可用类型。`
    }
    return formatMaterialDetail(detail)
  },
  {
    name: GET_MATERIAL_DETAIL_TOOL_NAME,
    description: GET_MATERIAL_DETAIL_TOOL_DESCRIPTION,
    schema: getMaterialDetailInputSchema,
  },
)

export const designTools = [searchMaterialsTool, getMaterialDetailTool]
