import { injectDataSources } from '@/context'
import axios from 'axios'
import type { ApiDataSourceSchema } from '@/schema/page.ts'
import { asyncCache, getByKeyOrPath } from '@vunio/utils'
import { toValue, type MaybeRefOrGetter } from 'vue'
import type { ResolvedDataQuery } from '@/runtime/dataQuery.ts'

export function useDataSource(
  dataId: Ref<string | number>,
  dataQuery?: MaybeRefOrGetter<ResolvedDataQuery>,
) {
  const dataSources = injectDataSources()
  const loading = ref(false)
  const error = ref()
  let pollingTimer: ReturnType<typeof setTimeout> | undefined
  let reloadTimer: ReturnType<typeof setTimeout> | undefined
  let requestId = 0

  const source = computed(() => {
    return dataSources.value.find((item) => item.id === dataId.value)
  })
  const resolvedQuery = computed<ResolvedDataQuery>(() => {
    return dataQuery
      ? toValue(dataQuery)
      : {
          params: {},
          ready: true,
          debounce: 0,
        }
  })
  const data = ref()

  async function loadData(params?: Record<string, any>) {
    const currentRequestId = ++requestId
    clearTimeout(pollingTimer)
    clearTimeout(reloadTimer)
    error.value = undefined
    if (!source.value) {
      data.value = undefined
      loading.value = false
      return
    }
    const currentSource = source.value
    if (currentSource.type === 'api') {
      const query = resolvedQuery.value
      if (!query.ready) {
        data.value = []
        loading.value = false
        return
      }
      try {
        loading.value = true
        const response = await fetchData(currentSource, {
          ...query.params,
          ...params,
        })
        if (currentRequestId === requestId) data.value = response
      } catch (e) {
        if (currentRequestId === requestId) error.value = e
      } finally {
        if (currentRequestId === requestId) {
          loading.value = false
          if (currentSource.interval) {
            pollingTimer = setTimeout(() => {
              loadData()
            }, currentSource.interval)
          }
        }
      }
    } else {
      data.value = currentSource.data
      loading.value = false
    }
  }

  function scheduleLoad() {
    requestId += 1
    clearTimeout(pollingTimer)
    clearTimeout(reloadTimer)
    if (source.value?.type === 'api' && !resolvedQuery.value.ready) {
      data.value = []
      loading.value = false
      error.value = undefined
      return
    }
    const debounce = resolvedQuery.value.debounce
    if (!debounce) {
      void loadData()
      return
    }
    reloadTimer = setTimeout(() => {
      void loadData()
    }, debounce)
  }

  watch([source, resolvedQuery], scheduleLoad, { immediate: true })

  onBeforeUnmount(() => {
    requestId += 1
    clearTimeout(pollingTimer)
    clearTimeout(reloadTimer)
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
  const res = await axios.request(config)
  if (source.responsePath) {
    return getByKeyOrPath(res.data, source.responsePath)
  } else {
    return res.data
  }
}

export const fetchData = asyncCache(fetchDataBase)
