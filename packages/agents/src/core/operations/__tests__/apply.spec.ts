import { describe, expect, it } from 'vitest'
import type { MaterialSchema, PageSchema } from '@ai-design/contracts'
import { applyDesignOperations } from '../apply.js'
import type { DesignOperation } from '../schemas.js'

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

/** 顶层子节点的 id 列表,用于断言树结构。 */
function ids(children: MaterialSchema[]): string[] {
  return children.map((child) => child.id)
}

function apply(source: PageSchema, operations: DesignOperation[]) {
  return applyDesignOperations(source, operations)
}

describe('applyDesignOperations — 旧实现的静默数据丢失回归', () => {
  it('新增节点后可以立刻往它下面追加子节点', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: node('new1') },
      { type: 'add-node', parentId: 'new1', node: node('new2') },
    ])

    expect(result.errors).toEqual([])
    expect(ids(result.page.root.children)).toEqual(['new1'])
    expect(ids(result.page.root.children[0]!.children)).toEqual(['new2'])
  })

  it('删除节点后可以复用同一个 id 重新创建', () => {
    const result = apply(page([node('a')]), [
      { type: 'remove-node', nodeId: 'a' },
      { type: 'add-node', parentId: 'root', node: node('a') },
    ])

    expect(result.errors).toEqual([])
    expect(ids(result.page.root.children)).toEqual(['a'])
  })

  it('拒绝重复 id —— 旧实现会静默产生两个同 id 节点', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: node('dup') },
      { type: 'add-node', parentId: 'root', node: node('dup') },
    ])

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({ kind: 'operation', index: 1 })
    // 失败时不留部分修改
    expect(ids(result.page.root.children)).toEqual([])
  })

  it('拒绝往已被删除的父节点下新增 —— 旧实现静默丢弃该节点并返回成功', () => {
    const result = apply(page([node('p1')]), [
      { type: 'remove-node', nodeId: 'p1' },
      { type: 'add-node', parentId: 'p1', node: node('lost') },
    ])

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({ kind: 'operation', index: 1 })
    expect(ids(result.page.root.children)).toEqual(['p1'])
  })

  it('拒绝移动到已被删除的子树 —— 旧实现让被移动节点静默消失', () => {
    const result = apply(page([node('a'), node('b', [node('b1')])]), [
      { type: 'remove-node', nodeId: 'b' },
      { type: 'move-node', nodeId: 'a', parentId: 'b1' },
    ])

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({ kind: 'operation', index: 1 })
    expect(ids(result.page.root.children)).toEqual(['a', 'b'])
  })

  it('删除只影响目标节点 —— 重复 id 已在写入时被拒绝,不会一次删掉两个', () => {
    const first = apply(page([]), [{ type: 'add-node', parentId: 'root', node: node('only') }])
    expect(first.errors).toEqual([])

    const second = apply(first.page, [{ type: 'remove-node', nodeId: 'only' }])
    expect(second.errors).toEqual([])
    expect(ids(second.page.root.children)).toEqual([])
  })
})

describe('applyDesignOperations — 容纳规则', () => {
  it('拒绝把节点放进叶子物料', () => {
    const result = apply(page([node('btn', [], 'button')]), [
      { type: 'add-node', parentId: 'btn', node: node('child', [], 'text') },
    ])

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({ kind: 'operation', index: 0 })
  })

  it('拒绝把 page-overlay 物料放进普通容器', () => {
    const result = apply(page([node('box')]), [
      { type: 'add-node', parentId: 'box', node: node('dlg', [], 'dialog-container') },
    ])

    expect(result.errors).toHaveLength(1)
  })

  it('允许 dialog 挂在页面根节点下', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: node('dlg', [], 'dialog-container') },
    ])

    expect(result.errors).toEqual([])
  })

  it('拒绝把表单项直接放到画布上', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: node('f', [], 'form-input') },
    ])

    expect(result.errors).toHaveLength(1)
  })

  it('move-node 也走容纳校验', () => {
    const result = apply(page([node('btn', [], 'button'), node('t', [], 'text')]), [
      { type: 'move-node', nodeId: 't', parentId: 'btn' },
    ])

    expect(result.errors).toHaveLength(1)
  })
})

describe('applyDesignOperations — 环与根节点保护', () => {
  it('拒绝把节点移动到它自己下面', () => {
    const result = apply(page([node('a')]), [
      { type: 'move-node', nodeId: 'a', parentId: 'a' },
    ])

    expect(result.errors).toHaveLength(1)
  })

  it('拒绝把节点移动到它自己的子节点下', () => {
    const result = apply(page([node('p', [node('c')])]), [
      { type: 'move-node', nodeId: 'p', parentId: 'c' },
    ])

    expect(result.errors).toHaveLength(1)
  })

  it('拒绝删除根节点', () => {
    const result = apply(page([]), [{ type: 'remove-node', nodeId: 'root' }])
    expect(result.errors).toHaveLength(1)
  })

  it('拒绝通过 update-node 修改根节点 —— 旧实现静默忽略', () => {
    const result = apply(page([]), [
      { type: 'update-node', nodeId: 'root', props: { changed: true } },
    ])

    expect(result.errors).toHaveLength(1)
    expect(result.page.root.props).toEqual({})
  })
})

describe('applyDesignOperations — 方案级错误', () => {
  it('空操作列表报 proposal 级错误,而不是伪造成操作错误', () => {
    const result = apply(page([]), [])

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({ kind: 'proposal', message: '没有需要执行的修改操作' })
  })
})

describe('applyDesignOperations — 正常路径', () => {
  it('update-node 合并 props 与 style,不覆盖未提及的键', () => {
    const base = page([
      {
        ...node('a'),
        props: { keep: 1, replace: 'old' },
        style: { color: 'red' },
      },
    ])

    const result = apply(base, [
      { type: 'update-node', nodeId: 'a', props: { replace: 'new' }, style: { size: 2 } },
    ])

    expect(result.errors).toEqual([])
    expect(result.page.root.children[0]!.props).toEqual({ keep: 1, replace: 'new' })
    expect(result.page.root.children[0]!.style).toEqual({ color: 'red', size: 2 })
  })

  it('move-node 把节点搬到新父节点下', () => {
    const result = apply(page([node('box'), node('a')]), [
      { type: 'move-node', nodeId: 'a', parentId: 'box' },
    ])

    expect(result.errors).toEqual([])
    expect(ids(result.page.root.children)).toEqual(['box'])
    expect(ids(result.page.root.children[0]!.children)).toEqual(['a'])
  })

  it('add-node 的 index 决定插入位置', () => {
    const result = apply(page([node('a'), node('b')]), [
      { type: 'add-node', parentId: 'root', node: node('mid'), index: 1 },
    ])

    expect(result.errors).toEqual([])
    expect(ids(result.page.root.children)).toEqual(['a', 'mid', 'b'])
  })

  it('不修改传入的页面对象', () => {
    const source = page([node('a')])
    const result = apply(source, [{ type: 'add-node', parentId: 'root', node: node('z') }])

    expect(ids(source.root.children)).toEqual(['a'])
    expect(ids(result.page.root.children)).toEqual(['a', 'z'])
  })

  it('保留 root 上除 children 之外的字段', () => {
    const source = page([])
    const result = apply(source, [{ type: 'add-node', parentId: 'root', node: node('a') }])

    expect(result.page.root.placement).toEqual(source.root.placement)
    expect(result.page.schemaVersion).toBe(source.schemaVersion)
    expect(result.page.id).toBe(source.id)
  })
})
