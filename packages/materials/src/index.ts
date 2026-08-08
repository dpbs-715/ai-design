import { canAcceptChild } from './containment.js'
import type { ContainmentParent } from './containment.js'
import {
  annotationFrameDescriptors,
  annotationNoteDescriptor,
} from './descriptors/annotation.js'
import {
  businessFormDescriptor,
  formItemDescriptors,
} from './descriptors/business-form.js'
import { buttonDescriptor } from './descriptors/button.js'
import { chartDescriptors } from './descriptors/charts.js'
import { freeContainerDescriptor } from './descriptors/container.js'
import { dialogDescriptor } from './descriptors/dialog.js'
import { imageDescriptor } from './descriptors/image.js'
import { dataTableDescriptor } from './descriptors/table.js'
import { textDescriptor, timeDescriptor } from './descriptors/text.js'
import type { MaterialDescriptor, MaterialGroup } from './descriptor.js'

export * from './containment.js'
export * from './descriptor.js'
export {
  annotationFrameDescriptors,
  annotationNoteDescriptor,
} from './descriptors/annotation.js'
export {
  businessFormDescriptor,
  formCheckboxGroupDescriptor,
  formColorDescriptor,
  formCommonSelectDescriptor,
  formDatePickerDescriptor,
  formInputDescriptor,
  formItemDescriptors,
  formRadioGroupDescriptor,
} from './descriptors/business-form.js'
export { buttonDescriptor } from './descriptors/button.js'
export { createCartesianOption, createChartBaseOption } from './descriptors/chart-options.js'
export {
  areaChartDescriptor,
  barChartDescriptor,
  chartDescriptors,
  lineChartDescriptor,
  pieChartDescriptor,
} from './descriptors/charts.js'
export { freeContainerDescriptor } from './descriptors/container.js'
export {
  dialogDescriptor,
  dialogHeaderHeight,
  minimumDialogContentHeight,
  minimumDialogHeight,
} from './descriptors/dialog.js'
export { imageDescriptor } from './descriptors/image.js'
export { dataTableDescriptor } from './descriptors/table.js'
export { textDescriptor, timeDescriptor } from './descriptors/text.js'
export * from './data-sources.js'
export * from './exposed-methods.js'
export { materialNodeSchemas } from './schemas/index.js'

/** 所有物料描述符。新增物料时在这里登记。 */
export const materialDescriptors: MaterialDescriptor[] = [
  freeContainerDescriptor,
  dialogDescriptor,
  textDescriptor,
  timeDescriptor,
  imageDescriptor,
  dataTableDescriptor,
  ...chartDescriptors,
  businessFormDescriptor,
  ...formItemDescriptors,
  annotationNoteDescriptor,
  ...annotationFrameDescriptors,
  buttonDescriptor,
]

/** 物料分组,顺序决定物料面板的展示顺序。 */
export const materialGroups: MaterialGroup[] = [
  { key: 'container', name: '容器' },
  { key: 'charts', name: '图表' },
  { key: 'data', name: '数据' },
  { key: 'info', name: '文本' },
  { key: 'media', name: '图片' },
  { key: 'annotation', name: '标注' },
  { key: 'form', name: '表单' },
  { key: 'interaction', name: '交互' },
]

const descriptorMap = new Map(materialDescriptors.map((item) => [item.type, item]))

export function getMaterialDescriptor(type: string): MaterialDescriptor | undefined {
  return descriptorMap.get(type)
}

export function getMaterialDescriptorsByGroup(group: string): MaterialDescriptor[] {
  return materialDescriptors.filter((item) => item.group === group)
}

/**
 * 按物料 type 判断父子关系是否合法。父节点传 type 而非描述符,
 * 便于调用方只持有节点数据。
 */
export function canMaterialTypeBeChild(parentType: string, childType: string): boolean {
  const parent: ContainmentParent =
    parentType === 'page-root'
      ? { kind: 'page-root' }
      : parentType === 'module-root'
        ? { kind: 'module-root' }
        : { kind: 'material', capability: descriptorMap.get(parentType)?.capability }
  return canAcceptChild(parent, descriptorMap.get(childType)?.capability)
}
