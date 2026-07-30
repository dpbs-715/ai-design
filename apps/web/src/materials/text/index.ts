import TextMaterial from './text/component.vue'
import TimeMaterial from './time/component.vue'
import { textMaterial } from './text/index.ts'
import { timeMaterial } from './time/index.ts'

export function install(register) {
  register(textMaterial, TextMaterial)
  register(timeMaterial, TimeMaterial)
}
