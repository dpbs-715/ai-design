import type { PageSchema } from '@/schema/page.ts'
import { Cache, CACHE_TYPE } from '@vunio/utils'

const SCREEN_PUBLISH = 'screen-publish'
const SCREEN_PUBLISH_VERSION = 'v0.0.1'
const publishCache = new Cache(CACHE_TYPE.localStorage, SCREEN_PUBLISH, SCREEN_PUBLISH_VERSION)
export function publishPage(page: PageSchema) {
  const value = publishCache.get() || {}
  const id = page.id || crypto.randomUUID()
  value[id] = page
  page.id = id
  publishCache.set(value)
  return id
}

export function getPublishPage(id: string) {
  const cacheData = publishCache.get()
  const page = cacheData[id]
  if (!page) {
    throw new Error(`暂无数据`)
  }
  return page
}
