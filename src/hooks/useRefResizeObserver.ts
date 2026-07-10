import { debounce } from '@/utils'

export function useRefResizeObserver(observerRef: Ref) {
  const height = ref()
  const width = ref()

  function setData(rect) {
    width.value = rect.width
    height.value = rect.height
  }

  const onRootResize = debounce(
    (rect) => {
      setData(rect)
    },
    100,
    {
      leading: true,
    },
  )

  onMounted(() => {
    const rect = observerRef.value.getBoundingClientRect()
    setData(rect)

    const ob = new ResizeObserver((entries) => {
      const entry = entries[0]
      const rect = entry.contentRect
      onRootResize(rect)
    })
    ob.observe(observerRef.value)

    onUnmounted(() => {
      ob.disconnect()
    })
  })
  return {
    height,
    width,
  }
}
