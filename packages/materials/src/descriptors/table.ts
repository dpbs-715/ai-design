import { createThemeColorReference } from '@ai-design/contracts'
import { DEFAULT_STATIC_OPTIONS_SOURCE_ID } from '../data-sources.js'
import type { MaterialDescriptor } from '../descriptor.js'

export const dataTableDescriptor: MaterialDescriptor = {
  key: 'data-table',
  type: 'data-table',
  name: '数据表格',
  group: 'data',
  description:
    '展示结构化数据的表格,支持多级表头、只读或可编辑模式、序号列与选择列。列定义在 props.columns,group 类型表示分组表头,column 类型表示实际数据列。',
  capability: {
    kind: 'leaf',
    roles: ['canvas-content'],
  },
  template: {
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
    dataId: DEFAULT_STATIC_OPTIONS_SOURCE_ID,
    events: [],
  },
}
