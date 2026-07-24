import type {
  MaterialCapability,
  MaterialDataBinding,
  MaterialDefinition,
  MaterialSetter,
} from '@/schema/material.ts'
import BusinessFormEditor from './editor.vue'
import BusinessFormPreview from './preview.vue'
import {
  businessFormNodeSchema,
  formCheckboxGroupNodeSchema,
  formColorNodeSchema,
  formCommonSelectNodeSchema,
  formDatePickerNodeSchema,
  formInputNodeSchema,
  formRadioGroupNodeSchema,
} from './schema.ts'
import { createThemeColorReference } from '@/theme/renderTheme.ts'

const labelPositionOptions = [
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
  { label: '顶部', value: 'top' },
]

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '默认', value: 'default' },
  { label: '大', value: 'large' },
]

const inputTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
]

const commonSelectTypeOptions = [
  { label: '普通选择', value: 'ElSelect' },
  { label: '树形选择', value: 'ElTreeSelect' },
]

const formItemCapability: MaterialCapability = {
  kind: 'leaf',
  roles: ['form-item'],
}

const optionDataBindings: MaterialDataBinding[] = [
  { label: '选项标签', field: 'props.control.labelField' },
  { label: '选项值', field: 'props.control.valueField' },
  { label: '禁用状态', field: 'props.control.disabledField' },
]

const formItemIdentitySetters: MaterialSetter[] = [
  { component: 'input', label: '字段名', field: 'props.field', span: 12 },
  { component: 'input', label: '标签', field: 'props.label', span: 12 },
]

const formItemEventOptions = [
  { label: '值变化', value: 'change', payloadType: 'unknown' },
  { label: '获得焦点', value: 'focus', payloadType: 'FocusEvent' },
  { label: '失去焦点', value: 'blur', payloadType: 'FocusEvent' },
]

function initialValueSetter(component = 'jsonValue'): MaterialSetter {
  return {
    component,
    label: '初始值',
    field: 'props.initialValue',
    span: 24,
    section: 'data',
  }
}

function rulesSetter(requiredMessage: string, allowLength = false): MaterialSetter {
  return {
    component: 'formRules',
    label: '校验规则',
    field: 'props.rules',
    span: 24,
    props: { allowLength, requiredMessage },
    ...(allowLength ? { model: { inputType: 'props.control.type' } } : {}),
  }
}

function formItemSetters(
  controlSetters: MaterialSetter[],
  dataSetters: MaterialSetter[],
  requiredMessage: string,
  allowLength = false,
) {
  return [
    ...formItemIdentitySetters,
    ...controlSetters,
    rulesSetter(requiredMessage, allowLength),
    ...dataSetters,
  ]
}

function hiddenUnlessInputType(inputType: 'text' | 'number') {
  return ({ formData }: { formData: Record<string, any> }) =>
    formData.props?.control?.type !== inputType
}

function hiddenUnlessCommonSelectType(componentType: 'ElSelect' | 'ElTreeSelect') {
  return ({ formData }: { formData: Record<string, any> }) =>
    formData.props?.control?.componentType !== componentType
}

function hiddenUnlessMultiple({ formData }: { formData: Record<string, any> }) {
  return !formData.props?.control?.multiple
}

const departmentOptions = [
  {
    id: 'option-development',
    label: '研发部',
    value: 'development',
    disabled: false,
  },
  {
    id: 'option-product',
    label: '产品部',
    value: 'product',
    disabled: false,
  },
]

const statusOptions = [
  { id: 'option-enabled', label: '启用', value: 'enabled', disabled: false },
  { id: 'option-disabled', label: '停用', value: 'disabled', disabled: false },
]

const tagOptions = [
  { id: 'option-important', label: '重点', value: 'important', disabled: false },
  { id: 'option-follow-up', label: '待跟进', value: 'follow-up', disabled: false },
]

export const businessFormMaterial: MaterialDefinition = {
  name: '业务表单',
  group: 'container',
  icon: 'fluent:form-20-filled',
  preview: {
    component: BusinessFormPreview,
    props: { kind: 'form' },
  },
  capability: {
    kind: 'container',
    roles: ['canvas-content'],
    accepts: ['form-item'],
  },
  editorComponent: BusinessFormEditor,
  childrenRenderer: 'material',
  validationSchema: businessFormNodeSchema,
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
      label: '标签位置',
      field: 'props.labelPosition',
      span: 12,
      props: { options: labelPositionOptions },
    },
    {
      component: 'number',
      label: '标签宽度',
      field: 'props.labelWidth',
      span: 12,
      props: { min: 0 },
    },
    {
      component: 'commonSelect',
      label: '尺寸',
      field: 'props.size',
      span: 12,
      props: { options: sizeOptions },
    },
    {
      component: 'switch',
      label: '整体禁用',
      field: 'props.disabled',
      span: 12,
    },
  ],
  customEventOptions: [
    { label: '提交', value: 'submit', payloadType: 'Record<string, unknown>' },
    { label: '重置', value: 'reset', payloadType: 'Record<string, unknown>' },
    {
      label: '字段变化',
      value: 'change',
      payloadType: '{ field: string; value: unknown; values: Record<string, unknown> }',
    },
  ],
  schema: {
    type: 'business-form',
    name: '业务表单',
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
    },
    events: [],
  },
}

export const formInputMaterial: MaterialDefinition = {
  name: '输入框',
  group: 'form',
  icon: 'fluent:text-field-20-filled',
  preview: {
    component: BusinessFormPreview,
    props: { kind: 'input' },
  },
  capability: formItemCapability,
  validationSchema: formInputNodeSchema,
  setters: formItemSetters(
    [
      {
        component: 'commonSelect',
        label: '输入类型',
        field: 'props.control.type',
        span: 12,
        props: { options: inputTypeOptions },
      },
      {
        component: 'input',
        label: '占位提示',
        field: 'props.control.placeholder',
        span: 24,
      },
      { component: 'switch', label: '可清空', field: 'props.control.clearable', span: 12 },
      { component: 'switch', label: '禁用', field: 'props.control.disabled', span: 12 },
      { component: 'switch', label: '只读', field: 'props.control.readonly', span: 12 },
      {
        component: 'number',
        label: '最大长度',
        field: 'props.control.maxlength',
        span: 12,
        props: { min: 1, precision: 0 },
        hidden: hiddenUnlessInputType('text'),
      },
      {
        component: 'switch',
        label: '显示字数',
        field: 'props.control.showWordLimit',
        span: 12,
        hidden: hiddenUnlessInputType('text'),
      },
      {
        component: 'number',
        label: '最小值',
        field: 'props.control.min',
        span: 12,
        hidden: hiddenUnlessInputType('number'),
      },
      {
        component: 'number',
        label: '最大值',
        field: 'props.control.max',
        span: 12,
        hidden: hiddenUnlessInputType('number'),
      },
      {
        component: 'number',
        label: '步长',
        field: 'props.control.step',
        span: 12,
        props: { min: 0.001 },
        hidden: hiddenUnlessInputType('number'),
      },
    ],
    [initialValueSetter()],
    '请输入内容',
    true,
  ),
  customEventOptions: formItemEventOptions,
  schema: {
    type: 'form-input',
    name: '输入框',
    placement: { type: 'form-item', span: 12 },
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

export const formCommonSelectMaterial: MaterialDefinition = {
  name: '选择器',
  group: 'form',
  icon: 'fluent:list-bar-20-filled',
  preview: {
    component: BusinessFormPreview,
    props: { kind: 'select' },
  },
  capability: formItemCapability,
  validationSchema: formCommonSelectNodeSchema,
  setters: formItemSetters(
    [
      {
        component: 'commonSelect',
        label: '选择类型',
        field: 'props.control.componentType',
        span: 12,
        props: { options: commonSelectTypeOptions },
      },
      {
        component: 'input',
        label: '占位提示',
        field: 'props.control.placeholder',
        span: 24,
      },
      { component: 'switch', label: '可清空', field: 'props.control.clearable', span: 12 },
      { component: 'switch', label: '可筛选', field: 'props.control.filterable', span: 12 },
      { component: 'switch', label: '多选', field: 'props.control.multiple', span: 12 },
      {
        component: 'input',
        label: '多选分隔符',
        field: 'props.control.joinSplit',
        span: 12,
        props: { placeholder: '留空时使用数组' },
        hidden: hiddenUnlessMultiple,
      },
      {
        component: 'switch',
        label: '父子不关联',
        field: 'props.control.checkStrictly',
        span: 12,
        hidden: hiddenUnlessCommonSelectType('ElTreeSelect'),
      },
      { component: 'switch', label: '禁用', field: 'props.control.disabled', span: 12 },
    ],
    [initialValueSetter()],
    '请选择内容',
  ),
  customEventOptions: formItemEventOptions,
  dataBindings: [
    ...optionDataBindings,
    { label: '子节点字段', field: 'props.control.childrenField' },
  ],
  schema: {
    type: 'form-common-select',
    name: '选择器',
    placement: { type: 'form-item', span: 12 },
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
        options: departmentOptions,
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

export const formRadioGroupMaterial: MaterialDefinition = {
  name: '单选框组',
  group: 'form',
  icon: 'fluent:radio-button-20-filled',
  preview: {
    component: BusinessFormPreview,
    props: { kind: 'radio' },
  },
  capability: formItemCapability,
  validationSchema: formRadioGroupNodeSchema,
  setters: formItemSetters(
    [
      {
        component: 'commonSelect',
        label: '显示形式',
        field: 'props.control.type',
        span: 12,
        props: {
          options: [
            { label: '默认', value: 'radio' },
            { label: '按钮', value: 'button' },
          ],
        },
      },
      { component: 'switch', label: '禁用', field: 'props.control.disabled', span: 12 },
    ],
    [initialValueSetter()],
    '请选择内容',
  ),
  customEventOptions: formItemEventOptions,
  dataBindings: optionDataBindings,
  schema: {
    type: 'form-radio-group',
    name: '单选框组',
    placement: { type: 'form-item', span: 12 },
    props: {
      field: 'status',
      label: '状态',
      initialValue: 'enabled',
      control: {
        disabled: false,
        type: 'radio',
        options: statusOptions,
        labelField: 'label',
        valueField: 'value',
        disabledField: 'disabled',
      },
      rules: [],
    },
    events: [],
  },
}

export const formCheckboxGroupMaterial: MaterialDefinition = {
  name: '复选框组',
  group: 'form',
  icon: 'fluent:checkbox-indeterminate-20-filled',
  preview: {
    component: BusinessFormPreview,
    props: { kind: 'checkboxGroup' },
  },
  capability: formItemCapability,
  validationSchema: formCheckboxGroupNodeSchema,
  setters: formItemSetters(
    [
      {
        component: 'number',
        label: '最少选择',
        field: 'props.control.min',
        span: 12,
        props: { min: 0, precision: 0 },
      },
      {
        component: 'number',
        label: '最多选择',
        field: 'props.control.max',
        span: 12,
        props: { min: 1, precision: 0 },
      },
      { component: 'switch', label: '禁用', field: 'props.control.disabled', span: 12 },
    ],
    [initialValueSetter()],
    '请至少选择一项',
  ),
  customEventOptions: formItemEventOptions,
  dataBindings: optionDataBindings,
  schema: {
    type: 'form-checkbox-group',
    name: '复选框组',
    placement: { type: 'form-item', span: 12 },
    props: {
      field: 'tags',
      label: '标签',
      initialValue: [],
      control: {
        disabled: false,
        min: 0,
        max: 2,
        options: tagOptions,
        labelField: 'label',
        valueField: 'value',
        disabledField: 'disabled',
      },
      rules: [],
    },
    events: [],
  },
}

export const formDatePickerMaterial: MaterialDefinition = {
  name: '日期选择',
  group: 'form',
  icon: 'fluent:calendar-20-filled',
  preview: {
    component: BusinessFormPreview,
    props: { kind: 'date' },
  },
  capability: formItemCapability,
  validationSchema: formDatePickerNodeSchema,
  setters: formItemSetters(
    [
      {
        component: 'commonSelect',
        label: '日期类型',
        field: 'props.control.type',
        span: 12,
        props: {
          options: [
            { label: '日期', value: 'date' },
            { label: '日期时间', value: 'datetime' },
            { label: '月份', value: 'month' },
            { label: '年份', value: 'year' },
          ],
        },
      },
      {
        component: 'input',
        label: '值格式',
        field: 'props.control.valueFormat',
        span: 12,
      },
      {
        component: 'input',
        label: '占位提示',
        field: 'props.control.placeholder',
        span: 24,
      },
      { component: 'switch', label: '可清空', field: 'props.control.clearable', span: 12 },
      { component: 'switch', label: '可输入', field: 'props.control.editable', span: 12 },
      { component: 'switch', label: '禁用', field: 'props.control.disabled', span: 12 },
    ],
    [initialValueSetter()],
    '请选择日期',
  ),
  customEventOptions: formItemEventOptions,
  schema: {
    type: 'form-date-picker',
    name: '日期选择',
    placement: { type: 'form-item', span: 12 },
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

export const formColorMaterial: MaterialDefinition = {
  name: '颜色选择',
  group: 'form',
  icon: 'fluent:color-20-filled',
  preview: {
    component: BusinessFormPreview,
    props: { kind: 'color' },
  },
  capability: formItemCapability,
  validationSchema: formColorNodeSchema,
  setters: formItemSetters(
    [
      {
        component: 'commonSelect',
        label: '颜色格式',
        field: 'props.control.colorFormat',
        span: 12,
        props: {
          options: [
            { label: '自动', value: 'auto' },
            { label: 'HEX', value: 'hex' },
            { label: 'RGB', value: 'rgb' },
          ],
        },
      },
      { component: 'switch', label: '透明度', field: 'props.control.showAlpha', span: 12 },
      { component: 'switch', label: '可清空', field: 'props.control.clearable', span: 12 },
      { component: 'switch', label: '禁用', field: 'props.control.disabled', span: 12 },
    ],
    [initialValueSetter('color')],
    '请选择颜色',
  ),
  customEventOptions: formItemEventOptions,
  schema: {
    type: 'form-color',
    name: '颜色选择',
    placement: { type: 'form-item', span: 12 },
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

export const formItemMaterials: MaterialDefinition[] = [
  formInputMaterial,
  formCommonSelectMaterial,
  formCheckboxGroupMaterial,
  formRadioGroupMaterial,
  formDatePickerMaterial,
  formColorMaterial,
]
