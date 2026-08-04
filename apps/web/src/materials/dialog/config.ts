import { isAbsolutePlacement, type MaterialSchema } from '@/schema/material.ts'

export interface DialogMaterialConfig {
  closeOnClickModal: boolean
  closeOnPressEscape: boolean
  contentHeight: number
  defaultOpen: boolean
  draggable: boolean
  modal: boolean
  modalBlur: boolean
  showClose: boolean
  title: string
  width: number
}

export const dialogHeaderHeight = 52
export const minimumDialogContentHeight = 120
export const minimumDialogHeight = dialogHeaderHeight + minimumDialogContentHeight
const defaultDialogWidth = 720
const defaultDialogHeight = 480

function booleanProp(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

export function resolveDialogMaterialConfig(schema: MaterialSchema): DialogMaterialConfig {
  const placement = schema.placement
  const width = isAbsolutePlacement(placement) ? placement.width : defaultDialogWidth
  const height = isAbsolutePlacement(placement) ? placement.height : defaultDialogHeight
  const title = typeof schema.props.title === 'string' ? schema.props.title.trim() : ''

  return {
    closeOnClickModal: booleanProp(schema.props.closeOnClickModal, false),
    closeOnPressEscape: booleanProp(schema.props.closeOnPressEscape, true),
    contentHeight: Math.max(height - dialogHeaderHeight, minimumDialogContentHeight),
    defaultOpen: booleanProp(schema.props.defaultOpen, false),
    draggable: booleanProp(schema.props.draggable, false),
    modal: booleanProp(schema.props.modal, true),
    modalBlur: booleanProp(schema.props.modalBlur, true),
    showClose: booleanProp(schema.props.showClose, true),
    title: title || '弹窗标题',
    width,
  }
}
