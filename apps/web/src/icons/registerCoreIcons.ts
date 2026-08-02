import { addCollection } from '@iconify/vue'
import coreIconCollections from './generated/core.json'

coreIconCollections.forEach((collection) => addCollection(collection))
