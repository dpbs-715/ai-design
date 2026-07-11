import { createContext } from '@vunio/hooks'
import type { DataSourceSchema } from '@/schema/page.ts'

export const [injectDataSources, provideDataSources] =
  createContext<Ref<DataSourceSchema[]>>('dataSources')
