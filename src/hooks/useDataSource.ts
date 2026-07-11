import { injectDataSources } from '@/context'

export function useDataSource(dataId: Ref<string | number>) {
  const dataSources = injectDataSources()

  const source = computed(() => {
    return dataSources.value.find((item) => item.id === dataId.value)
  })

  const data = computed(() => source.value?.data)

  return {
    data,
  }
}
