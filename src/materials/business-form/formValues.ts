import { deepClone, setByKeyOrPath } from '@vunio/utils'
import type { FormItemSchema } from './schema.ts'

export function createInitialFormValues(children: FormItemSchema[]) {
  const values: Record<string, unknown> = {}
  children.forEach((child) => {
    setByKeyOrPath(values, child.props.field, deepClone(child.props.initialValue))
  })
  return values
}

export function replaceFormValues(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
) {
  Object.keys(target).forEach((key) => delete target[key])
  Object.assign(target, deepClone(source))
}
