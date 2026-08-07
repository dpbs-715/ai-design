import { createThemeColorReference } from '@ai-design/contracts'
import {
  DEFAULT_STATIC_FORM_SOURCE_ID,
  DEFAULT_STATIC_OPTIONS_SOURCE_ID,
} from '../data-sources.js'
import type { MaterialCapability, MaterialDescriptor } from '../descriptor.js'
import { businessFormExposedMethods, formItemExposedMethods } from '../exposed-methods.js'

/** 表单项只能放在业务表单里,不能直接放到画布上。 */
const formItemCapability: MaterialCapability = {
  kind: 'leaf',
  roles: ['form-item'],
}

/** 表单项使用表单栅格布局,默认占半行。 */
const formItemPlacement = {
  type: 'form-item' as const,
  span: 12,
}

export const businessFormDescriptor: MaterialDescriptor = {
  key: 'business-form',
  type: 'business-form',
  name: '业务表单',
  group: 'container',
  description:
    '业务表单容器,按栅格排列表单项并统一提交。只接纳表单项类物料(form-input / form-common-select / form-radio-group / form-checkbox-group / form-date-picker / form-color),不能放普通画布物料。',
  capability: {
    kind: 'container',
    roles: ['canvas-content'],
    accepts: ['form-item'],
  },
  exposedMethods: businessFormExposedMethods,
  template: {
    type: 'business-form',
    name: '业务表单',
    dataId: DEFAULT_STATIC_FORM_SOURCE_ID,
    placement: {
      type: 'absolute',
      x: 0,
      y: 0,
      width: 720,
      height: 420,
    },
    childrenLayout: {
      type: 'form-grid',
    },
    style: {
      backgroundColor: createThemeColorReference('container-background'),
    },
    props: {
      labelPosition: 'top',
      labelWidth: 100,
      size: 'default',
      disabled: false,
      readonly: false,
    },
    events: [],
  },
}

export const formInputDescriptor: MaterialDescriptor = {
  key: 'form-input',
  type: 'form-input',
  name: '输入框',
  group: 'form',
  description:
    '文本或数字输入框。props.field 是提交时的字段名,props.control.type 取 text 或 number。只能放在业务表单内。',
  capability: formItemCapability,
  exposedMethods: formItemExposedMethods,
  template: {
    type: 'form-input',
    name: '输入框',
    placement: formItemPlacement,
    props: {
      field: 'name',
      label: '姓名',
      initialValue: '',
      control: {
        type: 'text',
        placeholder: '请输入内容',
        clearable: true,
        disabled: false,
        readonly: false,
        maxlength: 50,
        showWordLimit: false,
        min: 0,
        max: 100,
        step: 1,
      },
      rules: [
        {
          type: 'required',
          message: '请输入内容',
          trigger: ['blur', 'change'],
        },
      ],
    },
    events: [],
  },
}

export const formCommonSelectDescriptor: MaterialDescriptor = {
  key: 'form-common-select',
  type: 'form-common-select',
  name: '选择器',
  group: 'form',
  description:
    '下拉选择器,支持普通选择与树形选择、单选与多选。选项来自绑定的数据源。只能放在业务表单内。',
  capability: formItemCapability,
  exposedMethods: formItemExposedMethods,
  template: {
    type: 'form-common-select',
    name: '选择器',
    placement: formItemPlacement,
    dataId: DEFAULT_STATIC_OPTIONS_SOURCE_ID,
    props: {
      field: 'department',
      label: '所属部门',
      initialValue: null,
      control: {
        componentType: 'ElSelect',
        placeholder: '请选择部门',
        clearable: true,
        filterable: true,
        multiple: false,
        joinSplit: '',
        disabled: false,
        checkStrictly: false,
        options: [],
        labelField: 'label',
        valueField: 'value',
        disabledField: 'disabled',
        childrenField: 'children',
      },
      rules: [
        {
          type: 'required',
          message: '请选择所属部门',
          trigger: ['change'],
        },
      ],
    },
    events: [],
  },
}

export const formRadioGroupDescriptor: MaterialDescriptor = {
  key: 'form-radio-group',
  type: 'form-radio-group',
  name: '单选框组',
  group: 'form',
  description: '单选框组,从若干互斥选项里选一个。选项来自绑定的数据源。只能放在业务表单内。',
  capability: formItemCapability,
  exposedMethods: formItemExposedMethods,
  template: {
    type: 'form-radio-group',
    name: '单选框组',
    placement: formItemPlacement,
    dataId: DEFAULT_STATIC_OPTIONS_SOURCE_ID,
    props: {
      field: 'status',
      label: '状态',
      initialValue: null,
      control: {
        disabled: false,
        type: 'radio',
        options: [],
        labelField: 'label',
        valueField: 'value',
        disabledField: 'disabled',
      },
      rules: [],
    },
    events: [],
  },
}

export const formCheckboxGroupDescriptor: MaterialDescriptor = {
  key: 'form-checkbox-group',
  type: 'form-checkbox-group',
  name: '复选框组',
  group: 'form',
  description:
    '复选框组,可多选并限制最少/最多选择数量。选项来自绑定的数据源。只能放在业务表单内。',
  capability: formItemCapability,
  exposedMethods: formItemExposedMethods,
  template: {
    type: 'form-checkbox-group',
    name: '复选框组',
    placement: formItemPlacement,
    dataId: DEFAULT_STATIC_OPTIONS_SOURCE_ID,
    props: {
      field: 'tags',
      label: '标签',
      initialValue: [],
      control: {
        disabled: false,
        min: 0,
        max: 2,
        options: [],
        labelField: 'label',
        valueField: 'value',
        disabledField: 'disabled',
      },
      rules: [],
    },
    events: [],
  },
}

export const formDatePickerDescriptor: MaterialDescriptor = {
  key: 'form-date-picker',
  type: 'form-date-picker',
  name: '日期选择',
  group: 'form',
  description:
    '日期选择器,支持日期、日期时间、月份、年份四种类型。props.control.valueFormat 决定提交值的格式。只能放在业务表单内。',
  capability: formItemCapability,
  exposedMethods: formItemExposedMethods,
  template: {
    type: 'form-date-picker',
    name: '日期选择',
    placement: formItemPlacement,
    props: {
      field: 'date',
      label: '日期',
      initialValue: null,
      control: {
        placeholder: '请选择日期',
        disabled: false,
        clearable: true,
        editable: false,
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
      },
      rules: [],
    },
    events: [],
  },
}

export const formColorDescriptor: MaterialDescriptor = {
  key: 'form-color',
  type: 'form-color',
  name: '颜色选择',
  group: 'form',
  description: '颜色选择器,可选 HEX 或 RGB 格式、是否带透明度。只能放在业务表单内。',
  capability: formItemCapability,
  exposedMethods: formItemExposedMethods,
  template: {
    type: 'form-color',
    name: '颜色选择',
    placement: formItemPlacement,
    props: {
      field: 'color',
      label: '颜色',
      initialValue: '#409eff',
      control: {
        disabled: false,
        clearable: true,
        showAlpha: false,
        colorFormat: 'hex',
      },
      rules: [],
    },
    events: [],
  },
}

/** 六个表单项,顺序与物料面板一致。 */
export const formItemDescriptors: MaterialDescriptor[] = [
  formInputDescriptor,
  formCommonSelectDescriptor,
  formCheckboxGroupDescriptor,
  formRadioGroupDescriptor,
  formDatePickerDescriptor,
  formColorDescriptor,
]
