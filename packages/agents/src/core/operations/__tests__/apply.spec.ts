import { describe, expect, it } from 'vitest'
import type { MaterialSchema, PageSchema } from '@ai-design/contracts'
import {
  businessFormDescriptor,
  formCommonSelectDescriptor,
  formInputDescriptor,
} from '@ai-design/materials'
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

/**
 * 以真实物料模板为基础造节点 —— apply 阶段会跑物料级 schema(materialNodeSchemas),
 * 凭空写的极简夹具走不到要测的那一层。
 */
function form(children: MaterialSchema[]): MaterialSchema {
  return {
    ...businessFormDescriptor.template,
    id: 'user-form',
    children,
    events: [],
  } as MaterialSchema
}

function select(props: Record<string, any>, dataId?: string): MaterialSchema {
  const { dataId: _templateDataId, ...rest } = formCommonSelectDescriptor.template
  return {
    ...rest,
    id: 'field-gender',
    children: [],
    props: {
      ...formCommonSelectDescriptor.template.props,
      ...props,
      control: {
        ...(formCommonSelectDescriptor.template.props.control as Record<string, any>),
        ...props.control,
      },
    },
    events: [],
    ...(dataId === undefined ? {} : { dataId }),
  } as MaterialSchema
}

function input(controlOverride: Record<string, any> = {}): MaterialSchema {
  return {
    ...formInputDescriptor.template,
    id: 'field-name',
    children: [],
    props: {
      ...formInputDescriptor.template.props,
      control: {
        ...(formInputDescriptor.template.props.control as Record<string, any>),
        ...controlOverride,
      },
    },
    events: [],
  } as MaterialSchema
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

  /**
   * 入树的必须是 materialSchema 的解析结果,不是 operation 里的原始对象 ——
   * 否则页面树与 proposal 共享同一份节点,改一处会影响另一处。
   */
  it('写入解析后的副本,不与 operation 共享节点对象', () => {
    const raw = {
      type: 'free-container',
      name: '新节点',
      id: 'fresh',
      placement: { type: 'absolute' as const, x: 0, y: 0, width: 10, height: 10 },
      props: {},
      children: [],
      // normalize 会补 events:[],这里显式带上,让断言聚焦在「副本而非共享对象」。
      events: [],
    }
    const result = apply(page([]), [{ type: 'add-node', parentId: 'root', node: raw }])

    expect(result.errors).toEqual([])
    const added = result.page.root.children[0]!
    expect(added.id).toBe('fresh')
    // 内容一致但不是同一个对象,改页面树不会污染 proposal。
    expect(added).toEqual(raw)
    expect(added).not.toBe(raw)
  })
})

/**
 * 物料模板(`MaterialTemplate`)按约定省略 `children`,而节点(`materialSchema`)
 * 必填。prompt 让模型照模板生成,所以这个差异必须由 apply 侧吃掉 ——
 * 编辑器拖拽路径早就在 `createNode` 里这么做了。
 */
describe('applyDesignOperations — 模板到节点的结构补齐', () => {
  const template = {
    type: 'free-container',
    name: '自由容器',
    placement: { type: 'absolute' as const, x: 0, y: 0, width: 560, height: 360 },
    props: {},
  }

  it('顶层节点缺 children 时补成空数组', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: { ...template, id: 'box' } },
    ])

    expect(result.errors).toEqual([])
    expect(result.page.root.children[0]!.children).toEqual([])
  })

  it('嵌套子节点缺 children 时递归补齐', () => {
    const result = apply(page([]), [
      {
        type: 'add-node',
        parentId: 'root',
        node: { ...template, id: 'outer', children: [{ ...template, id: 'inner' }] },
      },
    ])

    expect(result.errors).toEqual([])
    const inner = result.page.root.children[0]!.children[0]!
    expect(inner.id).toBe('inner')
    expect(inner.children).toEqual([])
  })

  it('事件缺 code 时补成空串 —— 模板里空处理逻辑就是空串', () => {
    const result = apply(page([]), [
      {
        type: 'add-node',
        parentId: 'root',
        node: { ...template, id: 'box', events: [{ type: 'click', name: 'onClick' }] },
      },
    ])

    expect(result.errors).toEqual([])
    expect(result.page.root.children[0]!.events).toEqual([
      { type: 'click', name: 'onClick', code: '' },
    ])
  })

  /** 编辑器的物料级 schema 把 events 当必填数组,缺省时补 [] 而不是让它炸在客户端。 */
  it('缺 events 时补成空数组,嵌套子节点同样补齐', () => {
    const result = apply(page([]), [
      {
        type: 'add-node',
        parentId: 'root',
        node: { ...template, id: 'outer', children: [{ ...template, id: 'inner' }] },
      },
    ])

    expect(result.errors).toEqual([])
    const outer = result.page.root.children[0]!
    expect(outer.events).toEqual([])
    expect(outer.children[0]!.events).toEqual([])
  })

  /** name 没有唯一正确的默认值,补一个等于编数据 —— 要让 repair 节点去修。 */
  it('事件缺 name 时仍然报错,不猜一个函数名', () => {
    const result = apply(page([]), [
      {
        type: 'add-node',
        parentId: 'root',
        node: { ...template, id: 'box', events: [{ type: 'click' }] },
      },
    ])

    expect(result.errors[0]).toMatchObject({
      kind: 'operation',
      message: expect.stringContaining('events.0.name'),
    })
  })

  it('children 类型写错时原样透传给校验,不当成缺省', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: { ...template, id: 'box', children: 'nope' } },
    ])

    expect(result.errors[0]).toMatchObject({
      kind: 'operation',
      message: expect.stringContaining('children'),
    })
  })
})

/**
 * 结构合法、运行时行为不对的那一类。字段级约束由物料级 schema 负责,
 * 这里只剩「单看每个字段都合法、组合起来矛盾」的规则。
 *
 * 夹具以真实物料模板为基础改 —— 否则过不了 apply 阶段的物料级校验,
 * 根本走不到语义检查。
 */
describe('applyDesignOperations — props 语义冲突', () => {
  /** 完整 control + 内联选项。update-node 的 props 是整体替换,残缺 control 过不了结构校验。 */
  const inlineOptions = {
    control: {
      ...(formCommonSelectDescriptor.template.props.control as Record<string, any>),
      options: [
        { id: 'gender-male', label: '男', value: 'male', disabled: false },
        { id: 'gender-female', label: '女', value: 'female', disabled: false },
      ],
    },
  }

  it('内联 options 与 dataId 并存时报错 —— 运行时 dataId 会覆盖掉 options', () => {
    const result = apply(page([]), [
      {
        type: 'add-node',
        parentId: 'root',
        node: form([select(inlineOptions, 'default-static-options')]),
      },
    ])

    expect(result.errors[0]).toMatchObject({
      kind: 'operation',
      message: expect.stringContaining('dataId'),
    })
    // 整体失败不留部分修改。
    expect(result.page.root.children).toEqual([])
  })

  it('只写 options 不带 dataId 是合法的', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: form([select(inlineOptions)]) },
    ])

    expect(result.errors).toEqual([])
  })

  it('只写 dataId、options 为空数组是合法的 —— 这是模板的原始形态', () => {
    const result = apply(page([]), [
      {
        type: 'add-node',
        parentId: 'root',
        node: form([select({ control: { options: [] } }, 'default-static-options')]),
      },
    ])

    expect(result.errors).toEqual([])
  })

  it('update-node 补出 options 却留着 dataId 时报错 —— 查的是合并后的结果', () => {
    const existing = select({}, 'default-static-options')
    const result = apply(page([form([existing])]), [
      { type: 'update-node', nodeId: 'field-gender', props: inlineOptions },
    ])

    expect(result.errors[0]).toMatchObject({
      kind: 'operation',
      message: expect.stringContaining('dataId'),
    })
  })

  /**
   * update-node 只改一个节点,子树是页面里的既有内容。
   * 拿新规则去查旧节点,会让一次无关的合法修改被历史遗留问题挡下来。
   */
  it('update-node 不因子树里的既有冲突而失败', () => {
    const stale = select(inlineOptions, 'default-static-options')
    const result = apply(page([form([stale])]), [
      { type: 'update-node', nodeId: 'user-form', props: { labelWidth: 120 } },
    ])

    expect(result.errors).toEqual([])
  })
})

/**
 * 物料级结构校验 —— 与客户端 parsePageSchema 同一份 schema(materialNodeSchemas)。
 * 模型发明的取值、漏写的必填字段在服务端拦下交给 repair,而不是到客户端才硬失败。
 */
describe('applyDesignOperations — 物料级结构校验', () => {
  it('模型发明枚举值时报结构错误,路径定位到字段', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: form([input({ type: 'email' })]) },
    ])

    expect(result.errors[0]).toMatchObject({
      kind: 'operation',
      message: expect.stringContaining('props.control.type'),
    })
  })

  it('内联选项缺 id 时报出具体路径', () => {
    const result = apply(page([]), [
      {
        type: 'add-node',
        parentId: 'root',
        node: form([
          select({
            control: { options: [{ label: '男', value: 'male' }] },
          }),
        ]),
      },
    ])

    expect(result.errors[0]).toMatchObject({
      kind: 'operation',
      message: expect.stringContaining('props.control.options.0.id'),
    })
  })

  it('update-node 合并后的节点同样要过物料级校验', () => {
    const result = apply(page([form([input()])]), [
      { type: 'update-node', nodeId: 'field-name', props: { control: { type: 'email' } } },
    ])

    expect(result.errors[0]).toMatchObject({
      kind: 'operation',
      message: expect.stringContaining('control'),
    })
  })

  it('照模板补齐的节点能直接通过', () => {
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: form([input(), select({})]) },
    ])

    expect(result.errors).toEqual([])
  })

  it('pattern 校验规则是合法的 —— 契约存正则文本,运行时还原成 RegExp', () => {
    const node = input()
    node.props = {
      ...node.props,
      rules: [
        {
          type: 'pattern',
          value: '^\\w+@\\w+\\.\\w+$',
          message: '邮箱格式不正确',
          trigger: ['blur', 'change'],
        },
      ],
    }
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: form([node]) },
    ])

    expect(result.errors).toEqual([])
  })

  it('无法编译的正则在结构校验就拦下,不放行到运行时', () => {
    const node = input()
    node.props = {
      ...node.props,
      rules: [{ type: 'pattern', value: '([', message: '格式不正确', trigger: ['change'] }],
    }
    const result = apply(page([]), [
      { type: 'add-node', parentId: 'root', node: form([node]) },
    ])

    expect(result.errors[0]).toMatchObject({
      kind: 'operation',
      message: expect.stringContaining('props.rules.0.value'),
    })
  })
})
