import { describe, expect, it } from 'vitest'
import type { MaterialSchema, PageSchema } from '@ai-design/contracts'
import { formatPageOutline, formatSelectedNodes } from '../outline.js'

function node(id: string, children: MaterialSchema[] = [], type = 'free-container'): MaterialSchema {
  return {
    type,
    name: id,
    id,
    placement: { type: 'absolute', x: 0, y: 0, width: 100, height: 100 },
    children,
    props: {},
  }
}

function page(children: MaterialSchema[]): PageSchema {
  return {
    schemaVersion: 1,
    id: 'page-1',
    theme: {} as PageSchema['theme'],
    root: {
      id: 'root',
      type: 'page-root',
      name: '页面',
      placement: { type: 'canvas', width: 1920, height: 1080 },
      style: {} as PageSchema['root']['style'],
      props: {},
      events: [],
      children,
    },
    dataSources: [],
  }
}

describe('formatPageOutline', () => {
  it('空画布给出明确提示', () => {
    const text = formatPageOutline(page([]))
    expect(text).toContain('画布为空')
    expect(text).toContain('1920x1080')
  })

  it('标注容器与叶子 —— 模型据此判断能否放子节点', () => {
    const text = formatPageOutline(page([node('box'), node('btn', [], 'button')]))
    const lines = text.split('\n')

    expect(lines.find((line) => line.includes('id=box'))).toContain('容器')
    expect(lines.find((line) => line.includes('id=btn'))).toContain('叶子')
  })

  it('用缩进表达层级', () => {
    const text = formatPageOutline(page([node('outer', [node('inner')])]))
    const outer = text.split('\n').find((line) => line.includes('id=outer'))!
    const inner = text.split('\n').find((line) => line.includes('id=inner'))!

    expect(inner.length - inner.trimStart().length).toBeGreaterThan(
      outer.length - outer.trimStart().length,
    )
  })

  it('未知物料类型按叶子渲染,不抛错', () => {
    const text = formatPageOutline(page([node('x', [], 'unknown-type')]))
    expect(text).toContain('id=x')
    expect(text).toContain('叶子')
  })

  it('输出根节点 id 与类型', () => {
    const text = formatPageOutline(page([]))
    expect(text).toContain('id=root')
    expect(text).toContain('type=page-root')
  })
})

describe('formatSelectedNodes', () => {
  it('没有选中节点时返回“无”', () => {
    expect(formatSelectedNodes(page([node('a')]), [])).toBe('无')
  })

  it('列出选中节点的 id 与类型', () => {
    const text = formatSelectedNodes(page([node('a', [], 'button')]), ['a'])
    expect(text).toBe('a(button)')
  })

  it('标记已不存在的节点,而不是静默忽略', () => {
    expect(formatSelectedNodes(page([]), ['ghost'])).toContain('已不存在')
  })

  it('能定位嵌套节点', () => {
    const text = formatSelectedNodes(page([node('p', [node('c', [], 'text')])]), ['c'])
    expect(text).toBe('c(text)')
  })
})
