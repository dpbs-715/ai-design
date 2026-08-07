import type { Component } from 'vue'
import { dataTableDescriptor } from '@ai-design/materials'
import type { MaterialDefinition } from '@/schema/material.ts'
import { defineMaterial } from '@/materials/defineMaterial.ts'
import DataTableMaterial from './component.vue'
import DataTablePreview from './preview.vue'
import { tableNodeSchema } from './schema.ts'

export const dataTableMaterial = defineMaterial(dataTableDescriptor, {
  icon: 'fluent:table-20-filled',
  preview: {
    component: DataTablePreview,
  },
  validationSchema: tableNodeSchema,
  setters: [
    {
      component: 'themeColor',
      label: '背景颜色',
      field: 'style.backgroundColor',
      span: 24,
      props: { showAlpha: true },
    },
    {
      component: 'commonSelect',
      label: '表格模式',
      field: 'props.mode',
      span: 12,
      props: {
        options: [
          { label: '只读', value: 'readonly' },
          { label: '可编辑', value: 'editable' },
        ],
      },
    },
    {
      component: 'commonSelect',
      label: '表格尺寸',
      field: 'props.table.size',
      span: 12,
      props: {
        options: [
          { label: '小', value: 'small' },
          { label: '默认', value: 'default' },
          { label: '大', value: 'large' },
        ],
      },
    },
    {
      component: 'switch',
      label: '显示表头',
      field: 'props.table.showHeader',
      span: 12,
    },
    {
      component: 'switch',
      label: '显示序号',
      field: 'props.table.useIndex',
      span: 12,
    },
    {
      component: 'switch',
      label: '显示选择列',
      field: 'props.table.useSelection',
      span: 12,
    },
    {
      component: 'switch',
      label: '斑马纹',
      field: 'props.table.stripe',
      span: 12,
    },
    {
      component: 'switch',
      label: '显示边框',
      field: 'props.table.border',
      span: 12,
    },
    {
      component: 'switch',
      label: '溢出提示',
      field: 'props.table.showOverflowTooltip',
      span: 12,
    },
    {
      component: 'tableColumns',
      label: '列与多级表头',
      field: 'props.columns',
      span: 24,
    },
  ],
  customEventOptions: [
    {
      label: '单元格变化',
      value: 'change',
      payloadType:
        '{ rowIndex: number; rowKey: unknown; field: string; value: unknown; previousValue: unknown; row: Record<string, unknown>; rows: Record<string, unknown>[] }',
    },
    {
      label: '修改状态变化',
      value: 'dirty-change',
      payloadType: 'boolean',
    },
    {
      label: '操作列点击',
      value: 'action-click',
      payloadType:
        '{ actionId: string; actionLabel: string; columnId: string; rowIndex: number; rowKey: unknown; row: Record<string, unknown> }',
    },
  ],
  dataBindings: [{ label: '行唯一字段', field: 'props.rowKey' }],
})

export function install(register: (material: MaterialDefinition, component: Component) => void) {
  register(dataTableMaterial, DataTableMaterial)
}
