import type { MaterialCapability } from './descriptor.js'

/** 页面根节点接纳的子节点角色。 */
export const PAGE_ROOT_ACCEPTED_ROLES = ['canvas-content', 'page-overlay']

/** 模块根节点接纳的子节点角色。 */
export const MODULE_ROOT_ACCEPTED_ROLES = ['canvas-content']

/** 未声明 capability 的物料按普通画布内容处理。 */
export const DEFAULT_ROLES = ['canvas-content']

/**
 * 父节点的容纳描述。根节点没有 capability,用 acceptedRoles 直接给出。
 */
export type ContainmentParent =
  | { kind: 'page-root' }
  | { kind: 'module-root' }
  | { kind: 'material'; capability?: MaterialCapability }

function acceptedRolesOf(parent: ContainmentParent): string[] | undefined {
  switch (parent.kind) {
    case 'page-root':
      return PAGE_ROOT_ACCEPTED_ROLES
    case 'module-root':
      return MODULE_ROOT_ACCEPTED_ROLES
    case 'material':
      // 只有容器才可能接纳子节点,叶子物料一律拒绝。
      return parent.capability?.kind === 'container' ? parent.capability.accepts : undefined
  }
}

/**
 * 判断子物料能否放进父节点。这是唯一的容纳规则来源 —— 校验和编辑器都必须走它,
 * 否则会生成 button 里塞子节点这类非法结构。
 */
export function canAcceptChild(
  parent: ContainmentParent,
  childCapability?: MaterialCapability,
): boolean {
  const acceptedRoles = acceptedRolesOf(parent)
  if (!acceptedRoles?.length) return false
  const childRoles = childCapability?.roles ?? DEFAULT_ROLES
  return childRoles.some((role) => acceptedRoles.includes(role))
}
