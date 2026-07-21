import { install as installFrame } from './frame/index.ts'
import { install as installNote } from './note/index.ts'

export function install(register) {
  installFrame(register)
  installNote(register)
}
