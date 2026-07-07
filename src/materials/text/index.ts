import type { MaterialDefinition } from '@/materials/types.ts'
import TextMaterial from '@/materials/text/component.vue'

const textMaterial: MaterialDefinition = {
  // 物料元数据
  name: '文本',
  group: 'info',
  icon: 'solar:text-bold',

  schema: {
    //dsl
    type: 'text',
    name: '普通文本',
    layout: {
      x: 0,
      y: 0,
      width: 300,
      height: 50,
    },
    style: {
      color: 'white',
    },
    props: {
      content: 'hello world',
    },
  },
}

export function install(register) {
  register(textMaterial, TextMaterial)
}
