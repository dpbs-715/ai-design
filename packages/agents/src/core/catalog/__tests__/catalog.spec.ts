import { describe, expect, it } from 'vitest'
import {
  formatMaterialCatalog,
  formatMaterialDetail,
  getMaterialDetail,
  listMaterialSummaries,
} from '../catalog.js'

describe('listMaterialSummaries', () => {
  it('每个 type 只出现一次 —— annotation-frame 的四个预设合并为一条', () => {
    const summaries = listMaterialSummaries()
    const types = summaries.map((item) => item.type)
    expect(new Set(types).size).toBe(types.length)
    expect(types.filter((type) => type === 'annotation-frame')).toHaveLength(1)
  })

  it('容器物料带 accepts,叶子物料不带', () => {
    const summaries = listMaterialSummaries()
    const container = summaries.find((item) => item.type === 'free-container')
    const leaf = summaries.find((item) => item.type === 'button')

    expect(container).toMatchObject({ kind: 'container', accepts: ['canvas-content'] })
    expect(leaf).toMatchObject({ kind: 'leaf' })
    expect(leaf).not.toHaveProperty('accepts')
  })

  it('摘要不含 template —— 选型阶段不需要完整模板', () => {
    for (const summary of listMaterialSummaries()) {
      expect(summary).not.toHaveProperty('template')
    }
  })
})

describe('getMaterialDetail', () => {
  it('返回完整模板', () => {
    const detail = getMaterialDetail('button')
    expect(detail?.template.type).toBe('button')
    expect(detail?.template.placement).toMatchObject({ type: 'absolute' })
  })

  it('未知 type 返回 undefined', () => {
    expect(getMaterialDetail('nope')).toBeUndefined()
  })

  it('表单项的模板使用 form-item 布局', () => {
    expect(getMaterialDetail('form-input')?.template.placement).toEqual({
      type: 'form-item',
      span: 12,
    })
  })
})

describe('formatMaterialCatalog', () => {
  it('容器标注可容纳的角色,叶子标注不能有子节点', () => {
    const text = formatMaterialCatalog()
    expect(text).toContain('容器,可容纳=[canvas-content]')
    expect(text).toContain('不能有子节点')
  })

  /** 清单是模型选型的唯一依据 —— 漏一个 type,那个物料就等于不存在。 */
  it('每个 type 都出现,且各占一行', () => {
    const text = formatMaterialCatalog()
    const summaries = listMaterialSummaries()

    for (const summary of summaries) {
      expect(text).toContain(`- ${summary.type}(${summary.name})`)
    }
    // 每条物料两行:摘要行 + 说明行。
    expect(text.split('\n')).toHaveLength(summaries.length * 2)
  })
})

describe('formatMaterialDetail', () => {
  /** 定位模板那一行 —— 说明文字在模板前后都有,不能假定它在首行或末行。 */
  function templateLine(text: string): string {
    return text.split('\n').find((line) => line.trim().startsWith('{'))!.trim()
  }

  it('包含可被 JSON.parse 的模板', () => {
    const detail = getMaterialDetail('button')!
    const text = formatMaterialDetail(detail)

    expect(JSON.parse(templateLine(text))).toMatchObject({ type: 'button' })
  })

  /**
   * 模板省略了 id 和 children,而节点两者都必填。工具输出必须点明这件事,
   * 否则模型照抄模板就会产出缺 children 的节点被 apply 打回。
   */
  it('说明模板省略了 id 与 children', () => {
    const text = formatMaterialDetail(getMaterialDetail('free-container')!)

    expect(JSON.parse(templateLine(text))).not.toHaveProperty('children')
    expect(text).toContain('id')
    expect(text).toContain('children')
  })

  /**
   * 有暴露方法的物料(弹窗 / 图表 / 表格 / 表单)必须打印方法清单,
   * 否则模型写 trigger 调用时完全瞎猜。
   */
  it('打印物料暴露的方法清单', () => {
    const dialogText = formatMaterialDetail(getMaterialDetail('dialog-container')!)
    expect(dialogText).toContain('$context.trigger')
    expect(dialogText).toContain('open()')
    expect(dialogText).toContain('close()')

    const chartText = formatMaterialDetail(getMaterialDetail('bar-chart')!)
    expect(chartText).toContain('refresh()')

    // 没有暴露方法的物料(纯展示类)不应出现 trigger 相关文本。
    const textText = formatMaterialDetail(getMaterialDetail('text')!)
    expect(textText).not.toContain('trigger')
  })
})
