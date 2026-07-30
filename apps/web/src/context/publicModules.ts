import { createContext } from '@vunio/hooks'
import type { PublicModuleRecord } from '@/workspace/types.ts'

export const [injectPublicModules, providePublicModules] = createContext<Ref<PublicModuleRecord[]>>(
  ['ScreenEditor', 'ScreenRenderer'],
  'PublicModules',
)
