import { barMaterial } from './bar.ts'
import ChartMaterial from './component.vue'

export function install(register) {
  register(barMaterial, ChartMaterial)
}
