import type { DataSourceSchema } from '@/schema/page.ts'

export const DEFAULT_STATIC_OPTIONS_SOURCE_ID = 'default-static-options'
export const DEFAULT_STATIC_FORM_SOURCE_ID = 'default-static-form'

export function createDefaultDataSources(): DataSourceSchema[] {
  return [
    {
      type: 'static',
      id: DEFAULT_STATIC_OPTIONS_SOURCE_ID,
      name: '静态部门列表',
      data: [
        {
          id: 'department-development',
          label: '研发部',
          value: 'development',
          disabled: false,
        },
        {
          id: 'department-product',
          label: '产品部',
          value: 'product',
          disabled: false,
        },
        {
          id: 'department-finance',
          label: '财务部',
          value: 'finance',
          disabled: false,
        },
      ],
    },
    {
      type: 'static',
      id: DEFAULT_STATIC_FORM_SOURCE_ID,
      name: '静态表单对象',
      data: {
        id: 'form-001',
        name: '张明',
        department: 'development',
        status: 1,
        tags: [1, 2],
        date: '2026-07-27',
        color: '#409eff',
      },
    },
  ]
}

export function mergeDefaultDataSources(dataSources: DataSourceSchema[]) {
  const existingIds = new Set(dataSources.map((source) => source.id))
  const missingDefaults = createDefaultDataSources().filter((source) => !existingIds.has(source.id))
  return [...dataSources, ...missingDefaults]
}
