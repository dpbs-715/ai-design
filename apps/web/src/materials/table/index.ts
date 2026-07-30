import type { Component } from 'vue'
import type { MaterialDefinition } from '@/schema/material.ts'
import { createThemeColorReference } from '@/theme/renderTheme.ts'
import { DEFAULT_MOCK_OPTIONS_SOURCE_ID } from '@/dataSources/defaults.ts'
import DataTableMaterial from './component.vue'
import DataTablePreview from './preview.vue'
import { tableNodeSchema } from './schema.ts'

export const dataTableMaterial: MaterialDefinition = {
  name: '数据表格',
  group: 'data',
  icon: 'fluent:table-20-filled',
  preview: {
    component: DataTablePreview,
  },
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
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
  ],
  dataBindings: [{ label: '行唯一字段', field: 'props.rowKey' }],
  schema: {
    type: 'data-table',
    name: '数据表格',
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 720,
      height: 360,
    },
    style: {
      backgroundColor: createThemeColorReference('container-background'),
    },
    props: {
      mode: 'editable',
      rowKey: 'id',
      columns: [
        {
          type: 'group',
          id: 'table-group-main',
          label: '销售数据',
          hidden: false,
          headerAlign: 'center',
          children: [
            {
              type: 'column',
              id: 'table-column-label',
              field: 'label',
              label: '名称',
              hidden: false,
              minWidth: 140,
              align: 'left',
              headerAlign: 'center',
              display: {
                type: 'text',
                props: {},
              },
              editor: {
                enabled: true,
                component: 'input',
                props: {
                  placeholder: '请输入名称',
                  clearable: true,
                  options: [],
                },
                rules: [
                  {
                    type: 'required',
                    message: '名称不能为空',
                    trigger: ['blur', 'change'],
                  },
                ],
              },
            },
            {
              type: 'column',
              id: 'table-column-value',
              field: 'value',
              label: '数值',
              hidden: false,
              minWidth: 120,
              align: 'right',
              headerAlign: 'center',
              display: {
                type: 'number',
                props: {
                  precision: 2,
                },
              },
              editor: {
                enabled: true,
                component: 'number',
                props: {
                  placeholder: '请输入数值',
                  clearable: true,
                  options: [],
                },
                rules: [],
              },
            },
          ],
        },
      ],
      table: {
        useIndex: true,
        useSelection: false,
        stripe: true,
        border: true,
        size: 'small',
        showHeader: true,
        showOverflowTooltip: true,
      },
    },
    dataId: DEFAULT_MOCK_OPTIONS_SOURCE_ID,
    events: [],
  },
}

export function install(register: (material: MaterialDefinition, component: Component) => void) {
  register(dataTableMaterial, DataTableMaterial)
}
