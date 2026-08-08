import { projectModuleInstanceNodeSchema } from '@ai-design/contracts'
import type { z } from 'zod'
import {
  businessFormNodeSchema,
  formCheckboxGroupNodeSchema,
  formColorNodeSchema,
  formCommonSelectNodeSchema,
  formDatePickerNodeSchema,
  formInputNodeSchema,
  formRadioGroupNodeSchema,
} from './business-form.js'
import { tableNodeSchema } from './table.js'

/**
 * 物料级节点校验 schema,按物料 type 登记。
 *
 * contracts 的 `materialSchema` 只约束节点的通用骨架,`props` 是个不透明对象;
 * 各物料自己的 props 含义只有这里的 schema 描述。编辑器 `parsePageSchema` 用的就是
 * 这份注册表 —— agent 服务端在 apply 阶段也跑同一份(见
 * packages/agents/src/core/operations/apply.ts),让模型产出的不合法节点
 * 在 repair 循环里被修掉,而不是到客户端才硬失败。
 *
 * 没有登记的物料(纯展示类)没有额外约束,通用骨架校验就够。
 */
export const materialNodeSchemas: Record<string, z.ZodTypeAny> = {
  'business-form': businessFormNodeSchema,
  'form-input': formInputNodeSchema,
  'form-common-select': formCommonSelectNodeSchema,
  'form-radio-group': formRadioGroupNodeSchema,
  'form-checkbox-group': formCheckboxGroupNodeSchema,
  'form-date-picker': formDatePickerNodeSchema,
  'form-color': formColorNodeSchema,
  'data-table': tableNodeSchema,
  'project-module-instance': projectModuleInstanceNodeSchema,
}
