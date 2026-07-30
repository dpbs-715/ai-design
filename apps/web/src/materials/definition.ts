import type { MaterialTemplate } from '@ai-design/contracts'
import type { Component } from 'vue'
import type { z } from 'zod'

export interface MaterialSetter {
  field: string
  label: string
  component: string
  section?: 'config' | 'data'
  [key: string]: any
}

export interface EventOption {
  label: string
  value: string
  payloadType?: string
}

export interface MaterialPreviewDefinition {
  component: Component
  props?: Record<string, unknown>
}

export interface MaterialDataBinding {
  label: string
  field: string
}

export interface MaterialCapability {
  kind: 'leaf' | 'container'
  roles: string[]
  accepts?: string[]
}

export interface MaterialDefinition {
  name: string
  group: string
  icon?: string
  preview: MaterialPreviewDefinition

  capability?: MaterialCapability
  editorComponent?: Component
  childrenRenderer?: 'renderer' | 'material'
  validationSchema?: z.ZodType
  setters: MaterialSetter[]

  customEventOptions?: EventOption[]
  supportsDataSource?: boolean
  dataBindings?: MaterialDataBinding[]

  schema: MaterialTemplate
}
