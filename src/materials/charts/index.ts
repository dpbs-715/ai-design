import { barMaterial } from './bar.ts'
import { areaMaterial } from './area.ts'
import ChartMaterial from './component.vue'
import { lineMaterial } from '@/materials/charts/line.ts'
import { pieMaterial } from '@/materials/charts/pie.ts'

const chartsMaterial = [barMaterial, areaMaterial, lineMaterial, pieMaterial]
export function install(register) {
  chartsMaterial.forEach((material) => register(material, ChartMaterial))
}
