import type { EventOption } from '@/schema/material.ts'

export interface MaterialEventOptionGroup {
  label: string
  options: EventOption[]
}

export const commonMaterialEventOptions: EventOption[] = [
  {
    label: '点击事件',
    value: 'click',
  },
  {
    label: '双击事件',
    value: 'dblclick',
  },
  {
    label: '右键事件',
    value: 'contextmenu',
  },
  {
    label: '鼠标移入',
    value: 'mouseenter',
  },
  {
    label: '鼠标移出',
    value: 'mouseleave',
  },
  {
    label: '鼠标按下',
    value: 'mousedown',
  },
  {
    label: '鼠标松开',
    value: 'mouseup',
  },
  {
    label: '组件挂载',
    value: 'vnodeMounted',
  },
  {
    label: '组件更新',
    value: 'vnodeUpdated',
  },
  {
    label: '组件卸载',
    value: 'vnodeUnmounted',
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
