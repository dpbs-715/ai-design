import { createPageSchema } from '@/schema/createPage.ts'
import {
  createEmptyModuleContract,
  createEmptyModuleWiring,
  MODULE_DRAFT_VERSION,
  MODULE_SCHEMA_VERSION,
  type PublicModuleSchema,
} from '@/schema/module.ts'

export interface CreatePublicModuleSchemaOptions {
  id: string
  name: string
  width?: number
  height?: number
}

export function createPublicModuleSchema({
  id,
  name,
  width = 1200,
  height = 360,
}: CreatePublicModuleSchemaOptions): PublicModuleSchema {
  const page = createPageSchema({ id, name, width, height })
  return {
    schemaVersion: MODULE_SCHEMA_VERSION,
    kind: 'public-module',
    moduleId: id,
    version: MODULE_DRAFT_VERSION,
    theme: page.theme,
    root: {
      ...page.root,
      type: 'module-root',
      style: {
        ...page.root.style,
        background: {
          ...page.root.style.background,
          color: 'transparent',
        },
      },
      props: {
        ...page.root.props,
        clipContent: false,
      },
    },
    dataSources: page.dataSources,
    contract: createEmptyModuleContract(),
    wiring: createEmptyModuleWiring(),
  }
}
