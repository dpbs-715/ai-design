import { z } from 'zod'

/**
 * 物料详情工具的输入。
 *
 * 这里只定义 name / description / schema —— 与具体 LLM SDK 无关。
 * 绑定执行逻辑由 graph 层完成,避免把 provider 依赖泄进 core。
 */
export const getMaterialDetailInputSchema = z.object({
  type: z.string().min(1).describe('物料类型,例如 bar-chart、form-input。'),
})

export type GetMaterialDetailInput = z.infer<typeof getMaterialDetailInputSchema>

export const GET_MATERIAL_DETAIL_TOOL_NAME = 'get_material_detail'

export const GET_MATERIAL_DETAIL_TOOL_DESCRIPTION = [
  '取单个物料的完整信息,含创建节点用的默认模板。',
  'type 取自 system prompt 里的物料清单 —— 清单已经给全,这里只补清单没有的模板。',
  '在生成 add-node 操作之前调用它 —— 模板给出该物料必需的 props 结构,',
  '照抄模板再改动需要的字段,比凭空写 props 可靠得多。',
  '需要多个物料时一轮里并行取完,不要一个一个来。',
].join('')
