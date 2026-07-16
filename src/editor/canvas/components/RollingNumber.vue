<script setup lang="ts">
defineOptions({ name: 'RollingNumber' })

interface Props {
  value: number
  unit?: string
}

interface DigitSlot {
  place: number
  digit: string
}

type RollDirection = 'up' | 'down'

const ROLL_DURATION_MS = 120
const ROLL_SETTLE_DELAY_MS = 20

const { value, unit = '' } = defineProps<Props>()

const displayedValue = ref(Math.round(value))
const direction = ref<RollDirection>('up')

let pendingValue = displayedValue.value
let rolling = false
let rollTimer: number | undefined

const digitSlots = computed<DigitSlot[]>(() => {
  const digits = String(displayedValue.value).split('')

  return digits.map((digit, index) => ({
    place: digits.length - index - 1,
    digit,
  }))
})

function flushPendingValue() {
  if (rolling || pendingValue === displayedValue.value) return

  direction.value = pendingValue > displayedValue.value ? 'up' : 'down'
  displayedValue.value = pendingValue
  rolling = true

  rollTimer = window.setTimeout(() => {
    rolling = false
    flushPendingValue()
  }, ROLL_DURATION_MS + ROLL_SETTLE_DELAY_MS)
}

watch(
  () => Math.round(value),
  (nextValue) => {
    pendingValue = nextValue
    flushPendingValue()
  },
  { flush: 'sync' },
)

onScopeDispose(() => {
  if (rollTimer !== undefined) window.clearTimeout(rollTimer)
})
</script>

<template>
  <span class="rolling-number" :style="{ '--rolling-number-duration': `${ROLL_DURATION_MS}ms` }">
    <TransitionGroup
      :name="`rolling-number-place-${direction}`"
      tag="span"
      class="rolling-number__digits"
    >
      <span v-for="slot in digitSlots" :key="slot.place" class="rolling-number__slot">
        <Transition :name="`rolling-number-digit-${direction}`">
          <span :key="slot.digit" class="rolling-number__digit">
            {{ slot.digit }}
          </span>
        </Transition>
      </span>
    </TransitionGroup>

    <span v-if="unit" class="rolling-number__unit">{{ unit }}</span>
  </span>
</template>

<style scoped lang="scss">
.rolling-number {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.rolling-number__digits {
  display: inline-flex;
  align-items: center;
}

.rolling-number__slot {
  position: relative;
  display: inline-block;
  width: 0.62em;
  height: 1em;
  overflow: hidden;
}

.rolling-number__digit {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rolling-number__unit {
  margin-left: 1px;
}

.rolling-number-digit-up-enter-active,
.rolling-number-digit-up-leave-active,
.rolling-number-digit-down-enter-active,
.rolling-number-digit-down-leave-active,
.rolling-number-place-up-enter-active,
.rolling-number-place-up-leave-active,
.rolling-number-place-down-enter-active,
.rolling-number-place-down-leave-active {
  transition:
    transform var(--rolling-number-duration) ease-out,
    opacity var(--rolling-number-duration) ease-out;
}

.rolling-number-digit-up-enter-from,
.rolling-number-place-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.rolling-number-digit-up-leave-to,
.rolling-number-place-up-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.rolling-number-digit-down-enter-from,
.rolling-number-place-down-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.rolling-number-digit-down-leave-to,
.rolling-number-place-down-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .rolling-number__digit,
  .rolling-number__slot {
    transition: none;
  }
}
</style>
