import { createContext } from '@vunio/hooks'
import type { ShallowRef } from 'vue'

export type MaterialRenderMode = 'editor' | 'runtime'

export interface MaterialRenderContext {
  mode: MaterialRenderMode
  overlayTarget?: Readonly<ShallowRef<HTMLElement | null>>
}

export const [injectMaterialRenderContext, provideMaterialRenderContext] =
  createContext<MaterialRenderContext>(['CanvasRoot', 'ScreenRenderer'], 'MaterialRenderContext')
