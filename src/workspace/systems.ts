import type { BusinessSystem } from './types.ts'

export const businessSystems: BusinessSystem[] = [
  {
    id: 'production',
    name: '生产运营',
    description: '生产态势、能源与质量运营大屏',
    icon: 'fluent:production-20-regular',
  },
  {
    id: 'park',
    name: '智慧园区',
    description: '园区安防、空间与通行管理',
    icon: 'fluent:building-multiple-20-regular',
  },
  {
    id: 'equipment',
    name: '设备中心',
    description: '设备运行、巡检与预测维护',
    icon: 'fluent:settings-cog-multiple-20-regular',
  },
]
