import { deepClone, getByKeyOrPath, setByKeyOrPath } from '@vunio/utils'
import type { FormItemSchema } from './schema.ts'

export function createInitialFormValues(children: FormItemSchema[]) {
  const values: Record<string, unknown> = {}
  children.forEach((child) => {
    setByKeyOrPath(values, child.props.field, deepClone(child.props.initialValue))
  })
  return values
}

export function createSourceFormValues(children: FormItemSchema[], payload: unknown) {
  const values = createInitialFormValues(children)
  const source = Array.isArray(payload) ? payload[0] : payload
  if (!source || typeof source !== 'object' || Array.isArray(source)) return values

  children.forEach((child) => {
    const field = child.props.field
    const sourceValue = getByKeyOrPath(source, field)
    if (sourceValue !== undefined) setByKeyOrPath(values, field, deepClone(sourceValue))
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
