import { addCollection } from '@iconify/vue'
import editorIconCollections from './generated/editor.json'

editorIconCollections.forEach((collection) => addCollection(collection))
