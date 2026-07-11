import { injectDataSources } from '@/context'
import axios from 'axios'

export function useDataSource(dataId: Ref<string | number>) {
  const dataSources = injectDataSources()
  let timer

  const source = computed(() => {
    return dataSources.value.find((item) => item.id === dataId.value)
  })
  const data = ref()

  async function loadData() {
    if (!source.value) return
    if (source.value.type === 'api') {
      const url = source.value.url

      try {
        const search = new URLSearchParams(location.search)
        const params = Object.fromEntries(search.entries())
        const res = await axios.get(url, {
          params: {
            ...source.value.params,
            ...params,
          },
        })
        data.value = res.data
      } finally {
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

  watch(source, loadData, { immediate: true })

  onBeforeUnmount(() => {
    clearTimeout(timer)
  })
  return {
    data,
  }
}
