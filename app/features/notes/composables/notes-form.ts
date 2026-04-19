import { useCalendar } from '@entities/calendar/composables/calendar'
import { useGoogleCalendar } from '@features/integrations/google-calendar'
import type { CalendarEventDisplay } from '@entities/calendar/types'

export type NoteFormTab = 'details' | 'linked-event'

export interface NoteFormPayload {
  title: string
  content: string
  calendar_event_id: string
}

export const notesForm = () => {
  const { fetchEventsForRange } = useCalendar()
  const { fetchConnectedAccounts } = useGoogleCalendar()

  const activeTab = ref<NoteFormTab>('details')
  const title = ref('')
  const content = ref('')
  const selectedDate = ref<Date>(new Date())
  const selectedEventId = ref<string>('')
  const eventsCache = reactive<Record<string, CalendarEventDisplay[]>>({})
  const eventsLoading = ref(false)
  const monthKey = (year: number, month: number) => `${year}-${month}`
  const allEvents = computed(() => Object.values(eventsCache).flat())

  const eventsForSelectedDate = computed(() => {
    if (!selectedDate.value) return []

    const dateStr = selectedDate.value.toISOString().slice(0, 10)

    return allEvents.value
      .filter((e) => e.start_at.slice(0, 10) === dateStr)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
  })

  const selectEvent = (event: CalendarEventDisplay) => {
    selectedEventId.value = selectedEventId.value === event.id ? '' : event.id
  }

  const loadMonthEvents = async (year: number, month: number) => {
    const key = monthKey(year, month)
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)

    eventsLoading.value = true

    const result = await fetchEventsForRange({
      start: start.toISOString(),
      end: end.toISOString(),
    })

    eventsCache[key] = result
    eventsLoading.value = false
  }

  const initEventLinking = async () => {
    await fetchConnectedAccounts()

    const now = new Date()
    await loadMonthEvents(now.getFullYear(), now.getMonth() + 1)
  }

  const getPayload = (): NoteFormPayload => ({
    title: title.value,
    content: content.value,
    calendar_event_id: selectedEventId.value,
  })

  const onMonthChange = (value: { year: number; month: number }) => {
    loadMonthEvents(value.year, value.month)
  }

  const isDetailsFilled = computed(() => title.value.trim().length > 0)
  const isLinkedEventFilled = computed(() => selectedEventId.value !== '')

  const isValid = computed(() => isDetailsFilled.value)

  const reset = () => {
    activeTab.value = 'details'
    title.value = ''
    content.value = ''
    selectedDate.value = new Date()
    selectedEventId.value = ''
    Object.keys(eventsCache).forEach((key) => delete eventsCache[key])
  }

  return {
    activeTab,
    title,
    content,
    isValid,
    isDetailsFilled,
    isLinkedEventFilled,
    getPayload,
    reset,
    selectedDate,
    selectedEventId,
    eventsForSelectedDate,
    eventsLoading,
    selectEvent,
    initEventLinking,
    onMonthChange,
  }
}
