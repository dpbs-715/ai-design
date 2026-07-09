export interface Layout {
  x: number
  y: number
  width: number
  height: number
}

export interface MaterialSchema {
  type: string
  name: string
  id: string
  layout: Layout
  style?: Record<string, any>
  props: Record<string, any>
}

export interface MaterialDefinition {
  //region 物料元数据
  name: string
  group: string
  icon: string
  //endregion
  schema: Omit<MaterialSchema, 'id'>
}
