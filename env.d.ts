/// <reference types="vite/client" />

import type { createRuntimeContext } from './src/runtime/context.ts'

declare global {
  interface Window {
    $context: ReturnType<typeof createRuntimeContext>
  }
}

export {}
