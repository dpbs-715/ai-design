import { createContext } from '@vunio/hooks'
import type { RuntimeContext } from '@/runtime/context.ts'

export const [injectRuntimeContext, provideRuntimeContext] =
  createContext<RuntimeContext>('RuntimeContext')
