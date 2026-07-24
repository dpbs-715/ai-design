import { injectDataSources } from '@/context'
import axios from 'axios'
import type { ApiDataSourceSchema } from '@/schema/page.ts'
import { asyncCache, getByKeyOrPath } from '@vunio/utils'

export function useDataSource(dataId: Ref<string | number>) {
  const dataSources = injectDataSources()
  const loading = ref(false)
  const error = ref()
  let timer

  const source = computed(() => {
    return dataSources.value.find((item) => item.id === dataId.value)
  })
  const data = ref()

  async function loadData(params?: Record<string, any>) {
    clearTimeout(timer)
    if (!source.value) return
    if (source.value.type === 'api') {
      try {
        loading.value = true
        data.value = await fetchData(source.value, params)
      } catch (e) {
        error.value = e
      } finally {
        loading.value = false
        if (source.value.interval) {
          timer = setTimeout(() => {
            loadData()
          }, source.value.interval)
        }
      }
    } else {
      data.value = source.value.data
    }
  }

  watch(source, () => loadData(), { immediate: true })

  onBeforeUnmount(() => {
    clearTimeout(timer)
  })
  return {
    data,
    loading,
    error,
    refresh: loadData,
  }
}

export async function fetchDataBase(source: ApiDataSourceSchema, data?: Record<string, any>) {
  const search = new URLSearchParams(location.search)
  const params = Object.fromEntries(search.entries())

  const queryParams = {
    ...source.params,
    ...params,
    ...data,
  }

  const paramsKey = source.method === 'post' ? 'data' : 'params'
  const config = {
    url: source.url,
    method: source.method,
    [paramsKey]: queryParams,
  }
  console.log('config==>', config)
  const res = await axios.request(config)
  if (source.responsePath) {
    return getByKeyOrPath(res.data, source.responsePath)
  } else {
    return res.data
  }
}

export const fetchData = asyncCache(fetchDataBase)
