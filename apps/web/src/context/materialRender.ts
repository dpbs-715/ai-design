import { createContext } from '@vunio/hooks'

export type MaterialRenderMode = 'editor' | 'runtime'

export interface MaterialRenderContext {
  mode: MaterialRenderMode
}

export const [injectMaterialRenderContext, provideMaterialRenderContext] =
  createContext<MaterialRenderContext>(['CanvasRoot', 'ScreenRenderer'], 'MaterialRenderContext')
