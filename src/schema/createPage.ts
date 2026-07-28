import { createDefaultDataSources } from '@/dataSources/defaults.ts'
import { PAGE_SCHEMA_VERSION, type PageSchema } from '@/schema/page.ts'
import { createDefaultRenderTheme, createThemeColorReference } from '@/theme/renderTheme.ts'

export interface CreatePageSchemaOptions {
  id?: string
  name?: string
  width?: number
  height?: number
}

export function createPageSchema(options: CreatePageSchemaOptions = {}): PageSchema {
  return {
    schemaVersion: PAGE_SCHEMA_VERSION,
    id: options.id ?? crypto.randomUUID(),
    theme: createDefaultRenderTheme(),
    root: {
      id: 'page-root',
      type: 'page-root',
      name: options.name ?? '页面',
      placement: {
        type: 'canvas',
        width: options.width ?? 1920,
        height: options.height ?? 1080,
      },
      style: {
        background: {
          color: createThemeColorReference('page-background'),
          image: {
            src: '',
            fit: 'cover',
            position: 'center center',
            repeat: 'no-repeat',
            opacity: 1,
          },
        },
      },
      props: {},
      events: [],
      children: [],
    },
    dataSources: createDefaultDataSources(),
  }
}
