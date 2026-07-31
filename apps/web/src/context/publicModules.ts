import { createContext } from '@vunio/hooks'
import type { PublicModuleRecord } from '@ai-design/contracts/workspace'

export const [injectPublicModules, providePublicModules] = createContext<Ref<PublicModuleRecord[]>>(
  ['ScreenEditor', 'ScreenRenderer'],
  'PublicModules',
)
