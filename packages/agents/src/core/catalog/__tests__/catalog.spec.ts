import { describe, expect, it } from 'vitest'
import {
  formatMaterialDetail,
  formatMaterialSummaries,
  getMaterialDetail,
  listMaterialGroupKeys,
  listMaterialSummaries,
  searchMaterials,
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

describe('searchMaterials', () => {
  it('无条件时返回全部', () => {
    expect(searchMaterials()).toHaveLength(listMaterialSummaries().length)
  })

  it('按分组过滤', () => {
    const results = searchMaterials({ group: 'form' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((item) => item.group === 'form')).toBe(true)
  })

  it('关键词匹配 type', () => {
    const results = searchMaterials({ keyword: 'bar-chart' })
    expect(results.map((item) => item.type)).toContain('bar-chart')
  })

  it('关键词匹配中文名称', () => {
    expect(searchMaterials({ keyword: '按钮' }).map((item) => item.type)).toContain('button')
  })

  it('关键词匹配用途说明 —— “环形” 只出现在 description 里', () => {
    const results = searchMaterials({ keyword: '环形' })
    expect(results.map((item) => item.type)).toContain('pie-chart')
  })

  it('关键词不区分大小写', () => {
    expect(searchMaterials({ keyword: 'BUTTON' }).map((item) => item.type)).toContain('button')
  })

  it('分组与关键词同时生效', () => {
    const results = searchMaterials({ group: 'charts', keyword: '饼图' })
    expect(results).toHaveLength(1)
    expect(results[0]!.type).toBe('pie-chart')
  })

  it('无匹配时返回空数组', () => {
    expect(searchMaterials({ keyword: '不存在的物料xyz' })).toEqual([])
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

describe('formatMaterialSummaries', () => {
  it('容器标注可容纳的角色,叶子标注不能有子节点', () => {
    const text = formatMaterialSummaries(searchMaterials({ keyword: 'free-container' }))
    expect(text).toContain('容器')
    expect(text).toContain('canvas-content')

    expect(formatMaterialSummaries(searchMaterials({ keyword: 'button' }))).toContain(
      '不能有子节点',
    )
  })

  it('空结果给出明确提示而不是空字符串', () => {
    expect(formatMaterialSummaries([])).toBe('(没有匹配的物料)')
  })
})

describe('formatMaterialDetail', () => {
  it('包含可被 JSON.parse 的模板', () => {
    const detail = getMaterialDetail('button')!
    const text = formatMaterialDetail(detail)
    const jsonLine = text.split('\n').at(-1)!.trim()

    expect(JSON.parse(jsonLine)).toMatchObject({ type: 'button' })
    expect(text).toContain('必须自行补上唯一的 id')
  })
})

describe('listMaterialGroupKeys', () => {
  it('覆盖描述符实际使用的所有分组', () => {
    const groupKeys = new Set(listMaterialGroupKeys())
    for (const summary of listMaterialSummaries()) {
      expect(groupKeys.has(summary.group)).toBe(true)
    }
  })
})
