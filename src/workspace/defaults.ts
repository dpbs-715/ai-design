import { createNode } from '@/materials'
import { barMaterial } from '@/materials/charts/bar.ts'
import { pieMaterial } from '@/materials/charts/pie.ts'
import { textMaterial } from '@/materials/text/text/index.ts'
import { timeMaterial } from '@/materials/text/time/index.ts'
import { createPageSchema } from '@/schema/createPage.ts'
import type { AbsolutePlacement, MaterialTemplate } from '@/schema/material.ts'
import type {
  BusinessSystem,
  DesignProject,
  ProjectPageRecord,
  PublicModuleRecord,
} from './types.ts'
import { businessSystems } from './systems.ts'

const DEFAULT_SYSTEM_ID = 'production'
const DEFAULT_PROJECT_ID = 'production-operations-demo'
const DEFAULT_PAGE_ID = 'production-operations-overview'

interface DefaultWorkspaceData {
  selectedSystemId: string
  systems: BusinessSystem[]
  projects: DesignProject[]
  pages: ProjectPageRecord[]
  modules: PublicModuleRecord[]
}

function createDemoNode(
  template: MaterialTemplate,
  placement: AbsolutePlacement,
  props?: Record<string, unknown>,
) {
  const node = createNode(template)
  node.placement = placement
  if (props) Object.assign(node.props, props)
  return node
}

function createDemoPageSchema() {
  const schema = createPageSchema({
    id: DEFAULT_PAGE_ID,
    name: '运营总览',
  })

  const title = createDemoNode(
    textMaterial.schema,
    { type: 'absolute', x: 64, y: 40, width: 720, height: 88 },
    { content: '生产运营总览' },
  )
  Object.assign(title.style ?? {}, {
    fontSize: 42,
    padding: 12,
  })

  const currentTime = createDemoNode(timeMaterial.schema, {
    type: 'absolute',
    x: 1496,
    y: 48,
    width: 360,
    height: 72,
  })
  const productionTrend = createDemoNode(barMaterial.schema, {
    type: 'absolute',
    x: 64,
    y: 168,
    width: 1120,
    height: 760,
  })
  const qualityOverview = createDemoNode(pieMaterial.schema, {
    type: 'absolute',
    x: 1224,
    y: 168,
    width: 632,
    height: 760,
  })

  schema.root.children = [title, currentTime, productionTrend, qualityOverview]
  return schema
}

export function createDefaultWorkspaceData(
  timestamp = new Date().toISOString(),
): DefaultWorkspaceData {
  const demoPageSchema = createDemoPageSchema()

  return {
    selectedSystemId: DEFAULT_SYSTEM_ID,
    systems: businessSystems.map((system) => ({ ...system })),
    projects: [
      {
        id: DEFAULT_PROJECT_ID,
        systemId: DEFAULT_SYSTEM_ID,
        name: '生产运营看板',
        description: '用于体验页面设计、预览与发布流程的初始项目',
        createdAt: timestamp,
        updatedAt: timestamp,
        isFavorite: false,
        pageIds: [DEFAULT_PAGE_ID],
        moduleIds: [],
        lastEditedPageId: DEFAULT_PAGE_ID,
        thumbnailVariant: 'operations',
      },
    ],
    pages: [
      {
        id: DEFAULT_PAGE_ID,
        projectId: DEFAULT_PROJECT_ID,
        schema: demoPageSchema,
        moduleReferenceCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        thumbnailVariant: 'operations',
      },
    ],
    modules: [],
  }
}
