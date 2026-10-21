<script setup lang="ts">
import { computed } from 'vue'
import { DEMO_DAYS, countByDay, formatHour, todaysSchedule, upcomingToday, type DemoAccount, type DemoAccountId, type DemoEvent } from '../demo-data'

const props = defineProps<{ events: DemoEvent[]; accounts: DemoAccount[]; visibleIds: DemoAccountId[] }>()
const emit = defineEmits<{ open: [id: number] }>()

const dates = [19, 20, 21, 22, 23]
const WIDTH = 300
const HEIGHT = 120
const PADDING = 14

const counts = computed(() => countByDay(props.events, props.visibleIds))
const total = computed(() => counts.value.reduce((sum, count) => sum + count, 0))
const connected = computed(() => props.accounts.filter((account) => !account.own).length)
const upcoming = computed(() => upcomingToday(props.events, props.visibleIds))
const schedule = computed(() => todaysSchedule(props.events, props.visibleIds))

const points = computed(() => {
  const top = Math.max(4, ...counts.value)
  return counts.value.map((count, index) => ({
    x: PADDING + (index * (WIDTH - PADDING * 2)) / (counts.value.length - 1),
    y: HEIGHT - PADDING - (count / top) * (HEIGHT - PADDING * 2),
    count,
  }))
})

// smooth curve through the points (same idea as chart.js tension 0.45)
const linePath = computed(() => {
  const list = points.value
  const tension = 0.45
  let path = `M ${list[0]!.x} ${list[0]!.y}`
  for (let index = 0; index < list.length - 1; index++) {
    const before = list[index - 1] ?? list[index]!
    const from = list[index]!
    const to = list[index + 1]!
    const after = list[index + 2] ?? to
    const c1x = from.x + ((to.x - before.x) * tension) / 2
    const c1y = from.y + ((to.y - before.y) * tension) / 2
    const c2x = to.x - ((after.x - from.x) * tension) / 2
    const c2y = to.y - ((after.y - from.y) * tension) / 2
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`
  }
  return path
})

const areaPath = computed(() => {
  const list = points.value
  return `${linePath.value} L ${list[list.length - 1]!.x} ${HEIGHT} L ${list[0]!.x} ${HEIGHT} Z`
})

function account(id: DemoAccountId) {
  return props.accounts.find((item) => item.id === id)!
}
</script>

<template>
  <div class="flex h-full flex-col gap-3 overflow-auto bg-white px-5 py-[18px]">
    <h3 class="text-[15px] font-semibold tracking-[-0.02em]">Dashboard</h3>

    <div class="grid grid-cols-3 gap-2.5">
      <div data-stat="events" class="rounded-lg border border-border p-2.5">
        <div class="text-[10.5px] text-placeholder">Events This Week</div>
        <b class="text-xl font-semibold">{{ total }}</b>
      </div>
      <div data-stat="accounts" class="rounded-lg border border-border p-2.5">
        <div class="text-[10.5px] text-placeholder">Connected Accounts</div>
        <b class="text-xl font-semibold">{{ connected }}</b>
      </div>
      <div data-stat="upcoming" class="rounded-lg border border-border p-2.5">
        <div class="text-[10.5px] text-placeholder">Upcoming Today</div>
        <b class="text-xl font-semibold">{{ upcoming.length }}</b>
      </div>
    </div>

    <div class="rounded-lg border border-border p-3">
      <div class="mb-1 text-[11px] font-medium text-zinc-600">Events per day</div>
      <div class="relative h-[110px]">
        <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" class="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          <path :d="areaPath" fill="#9688CF" fill-opacity="0.15" />
          <path :d="linePath" fill="none" stroke="#9688CF" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        </svg>
        <span
          v-for="(point, index) in points"
          :key="index"
          class="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#9688CF]"
          :style="{ left: `${(point.x / WIDTH) * 100}%`, top: `${(point.y / HEIGHT) * 100}%` }"
        />
      </div>
      <div class="mt-1.5 grid grid-cols-5 text-center text-[10.5px] text-placeholder">
        <span v-for="(day, index) in DEMO_DAYS" :key="day">{{ day }} {{ dates[index] }}</span>
      </div>
    </div>

    <div class="rounded-lg border border-border p-3">
      <div class="mb-1.5 text-[11px] font-medium text-zinc-600">Today's Schedule</div>
      <div v-if="!schedule.length" class="py-2 text-placeholder">Nothing scheduled today.</div>
      <button v-for="event in schedule" :key="event.id" type="button" data-schedule class="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left hover:bg-zinc-50" @click="emit('open', event.id)">
        <span class="w-10 flex-none text-[11px] text-placeholder">{{ formatHour(event.start) }}</span>
        <span class="h-7 w-1 flex-none rounded-full" :style="{ background: account(event.account).color }" />
        <span class="min-w-0 flex-1">
          <b class="block truncate font-medium">{{ event.title }}</b>
          <span class="block truncate text-[10.5px] text-placeholder">{{ account(event.account).email ?? 'Planify' }}</span>
        </span>
        <span v-for="(note, index) in event.notes" :key="index" class="hidden rounded-[3px] bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 tablet:inline">{{ note.title }}</span>
      </button>
    </div>
  </div>
</template>
