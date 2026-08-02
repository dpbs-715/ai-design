import { normalizeProjectModuleInstanceProps } from '@ai-design/contracts/module'
import type { PageSchema } from '@ai-design/contracts/page'
import { BadRequestException, Injectable } from '@nestjs/common'
import { z } from 'zod'

import type { ModuleReferenceInput } from './module-reference.repository.js'

@Injectable()
export class SchemaReferenceService {
  collect(schema: { root: { children: PageSchema['root']['children'] } }): ModuleReferenceInput[] {
    const references: ModuleReferenceInput[] = []
    const visit = (nodes: PageSchema['root']['children']) => {
      nodes.forEach((node) => {
        if (node.type === 'project-module-instance') {
          const { moduleId, version, updatePolicy } = normalizeProjectModuleInstanceProps(
            node.props,
          )
          const match = /^v([1-9]\d*)$/.exec(version)
          if (!z.uuid().safeParse(moduleId).success || !match) {
            throw new BadRequestException(`节点 ${node.id} 的公共模块引用不正确`)
          }
          references.push({
            nodeId: node.id,
            moduleId,
            versionNo: Number(match[1]),
            updatePolicy,
          })
        }
        visit(node.children)
      })
    }
    visit(schema.root.children)
    return references
  }

  rejectSelfReference(moduleId: string, references: ModuleReferenceInput[]): void {
    if (references.some((reference) => reference.moduleId === moduleId)) {
      throw new BadRequestException('公共模块不能引用自身')
    }
  }
}
