import type { PageSchema } from '@ai-design/contracts'
import { z } from 'zod'
import type { DesignError } from '../../core/operations/errors.js'
import type { DesignOperation } from '../../core/operations/schemas.js'

export const pageDesignInputSchema = z.object({
  request: z.string().trim().min(1, '请输入设计需求'),
  selectedNodeIds: z.array(z.string().min(1)).optional(),
})

export interface PageDesignInput extends z.infer<typeof pageDesignInputSchema> {
  page: PageSchema
}

export interface PageDesignResult {
  /** 全部操作成功应用时为 true。 */
  ok: boolean
  summary: string
  operations: DesignOperation[]
  /** 仅在 ok 为 true 时存在。 */
  previewPage?: PageSchema
  errors: DesignError[]
}
