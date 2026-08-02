import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'

export class InvalidModuleReferenceError extends Error {}

export function postgresCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined
}

function postgresConstraint(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'constraint' in error
    ? String(error.constraint)
    : undefined
}

export function rethrowUniqueConstraint(error: unknown, message: string): never {
  if (postgresCode(error) === '23505') throw new ConflictException(message)
  throw error
}

export function rethrowAssetConstraint(error: unknown): never {
  if (error instanceof InvalidModuleReferenceError) {
    throw new BadRequestException('Schema 引用了不存在、已删除或不属于当前项目的公共模块版本')
  }
  const code = postgresCode(error)
  if (code === '23503') {
    if (postgresConstraint(error)?.startsWith('module_references_target_')) {
      throw new BadRequestException('Schema 引用了不存在或不属于当前项目的公共模块版本')
    }
    throw new NotFoundException('项目不存在')
  }
  if (code === '23505') throw new ConflictException('资源 ID 已存在')
  throw error
}
