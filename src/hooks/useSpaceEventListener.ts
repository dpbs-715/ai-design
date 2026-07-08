export function useSpaceEventListener() {
  const active = ref(false)

  function spaceDown(event) {
    if (event.key === ' ') {
      if (!active.value) {
        active.value = true
      }
    }
  }
  function spaceUp(event) {
    if (event.key === ' ') {
      active.value = false
    }
  }

  addEventListener('keydown', spaceDown)
  addEventListener('keyup', spaceUp)

  onUnmounted(() => {
    removeEventListener('keydown', spaceDown)
    removeEventListener('keyup', spaceUp)
  })

  return {
    active,
  }
}
