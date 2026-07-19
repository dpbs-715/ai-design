import type { EventOption } from '@/schema/material.ts'

export interface MaterialEventOptionGroup {
  label: string
  options: EventOption[]
}

export const commonMaterialEventOptions: EventOption[] = [
  {
    label: '点击事件',
    value: 'click',
    payloadType: 'MouseEvent',
  },
  {
    label: '双击事件',
    value: 'dblclick',
    payloadType: 'MouseEvent',
  },
  {
    label: '右键事件',
    value: 'contextmenu',
    payloadType: 'MouseEvent',
  },
  {
    label: '鼠标移入',
    value: 'mouseenter',
    payloadType: 'MouseEvent',
  },
  {
    label: '鼠标移出',
    value: 'mouseleave',
    payloadType: 'MouseEvent',
  },
  {
    label: '鼠标按下',
    value: 'mousedown',
    payloadType: 'MouseEvent',
  },
  {
    label: '鼠标松开',
    value: 'mouseup',
    payloadType: 'MouseEvent',
  },
  {
    label: '组件挂载',
    value: 'vnodeMounted',
    payloadType: 'EventScriptVNode',
  },
  {
    label: '组件更新',
    value: 'vnodeUpdated',
    payloadType: 'EventScriptVNode',
  },
  {
    label: '组件卸载',
    value: 'vnodeUnmounted',
    payloadType: 'EventScriptVNode',
  },
]

export function createMaterialEventOptionGroups(
  customEventOptions: EventOption[],
): MaterialEventOptionGroup[] {
  const groups: MaterialEventOptionGroup[] = [
    { label: '通用事件', options: commonMaterialEventOptions },
  ]
  if (customEventOptions.length) {
    groups.unshift({ label: '物料事件', options: customEventOptions })
  }
  return groups
}

export function filterMaterialEventOptionGroups(
  groups: MaterialEventOptionGroup[],
  searchKeyword: string,
): MaterialEventOptionGroup[] {
  const keyword = searchKeyword.trim().toLowerCase()
  if (!keyword) return groups

  return groups
    .map((group) => ({
      ...group,
      options: group.options.filter(
        (option) =>
          option.label.toLowerCase().includes(keyword) ||
          option.value.toLowerCase().includes(keyword),
      ),
    }))
    .filter((group) => group.options.length > 0)
}
