import { computed, type Ref } from 'vue'

export interface WeekEventInput {
  start_at: string
}

export interface WeekDayBucket {
  dayIndex: number
  shortLabel: string
  date: number
  count: number
  iso: string
}

const DAY_SHORT_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const startOfWeekMonday = (now: Date): Date => {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

const stripZone = (iso: string) => iso.replace(/\[.*\]$/, '')

export const useWeeklyEventsChart = (events: Ref<WeekEventInput[]>) => {
  const buckets = computed<WeekDayBucket[]>(() => {
    const now = new Date()
    const weekStart = startOfWeekMonday(now)

    const initial: WeekDayBucket[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      return {
        dayIndex: i,
        shortLabel: DAY_SHORT_LABELS[i] ?? '',
        date: date.getDate(),
        count: 0,
        iso: date.toISOString(),
      }
    })

    const weekStartMs = weekStart.getTime()
    const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000

    for (const event of events.value) {
      const t = new Date(stripZone(event.start_at)).getTime()
      if (Number.isNaN(t) || t < weekStartMs || t >= weekEndMs) continue
      const idx = Math.floor((t - weekStartMs) / (24 * 60 * 60 * 1000))
      if (idx >= 0 && idx < 7) initial[idx]!.count += 1
    }

    return initial
  })

  const range = computed(() => {
    const start = startOfWeekMonday(new Date())
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  })

  return { buckets, range }
}
