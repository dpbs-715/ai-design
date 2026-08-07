import { createThemeColorReference } from '@ai-design/contracts'
import { DEFAULT_STATIC_OPTIONS_SOURCE_ID } from '../data-sources.js'
import type { MaterialDescriptor } from '../descriptor.js'

export const dataTableDescriptor: MaterialDescriptor = {
  key: 'data-table',
  type: 'data-table',
  name: '数据表格',
  group: 'data',
  description:
    '展示结构化数据的表格,支持多级表头、只读或可编辑模式、序号列与选择列。列定义在 props.columns:group 表示分组表头,column 表示数据列,action 表示操作列。' +
    'action 列不绑定数据,只渲染 actions[] 里的按钮(每项含 id/label/variant/icon),点击时抛出 action-click 事件,' +
    'payload 为 { actionId, actionLabel, columnId, rowIndex, rowKey, row }。' +
    '要做「点编辑打开弹窗并回填」时:加一个 action 列(actions 里放 id 为 edit 的按钮),' +
    '再给表格配 action-click 事件,脚本里按 actionId 分支,用 $context.trigger(弹窗id, "open") 打开弹窗、' +
    '$context.trigger(表单id, "setValues", $payload.row) 回填行数据。',
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
