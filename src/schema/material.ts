import type { Component } from 'vue'

export interface Layout {
  x: number
  y: number
  width: number
  height: number
}

export interface MaterialEvent {
  type: string
  name: string
  /**
   * function body
   * */
  code: string

  title?: string

  handler?: (...args: any[]) => any
}

export interface MaterialSchema {
  type: string
  name: string
  id: string
  locked?: boolean
  layout: Layout
  style?: Record<string, any>
  props: Record<string, any>
  dataId?: string | number
  events?: MaterialEvent[]
}
interface SetterSchema {
  field: string
  label: string
  component: string
  [key: string]: any
}

export interface EventOption {
  label: string
  value: string
}

export interface MaterialPreviewDefinition {
  component: Component
  props?: Record<string, unknown>
}

export interface MaterialDataBinding {
  label: string
  field: string
}

export interface MaterialDefinition {
  //region 物料元数据
  name: string
  group: string
  preview: MaterialPreviewDefinition
  //endregion

  setters: SetterSchema[]

  eventOptions?: EventOption[]
  dataBindings?: MaterialDataBinding[]

  schema: Omit<MaterialSchema, 'id'>
}
