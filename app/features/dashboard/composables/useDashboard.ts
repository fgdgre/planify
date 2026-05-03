import {
  useGoogleCalendarStore,
  useGoogleCalendar,
  type CalendarEvent,
} from '@features/integrations/google-calendar'
import { useInternalEvents } from '@entities/calendar/composables/useInternalEvents'
import { useWeeklyEventsChart } from '@entities/charts'
import { useNotes, useNotesStore } from '@features/notes'
import type { Note } from '@features/notes'
import { useUserStore } from '@features/auth'
import { useSettings, useSettingsStore } from '@features/settings'
import { ACCOUNT_COLORS, INTERNAL_CALENDAR_COLOR } from '@entities/calendar/stores/calendar'
import type { Database } from '@shared/api/supabase/types/database'

const stripZone = (iso: string) => iso.replace(/\[.*\]$/, '')

const startOfWeekMonday = (now: Date) => {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const endOfToday = () => {
  const d = startOfToday()
  d.setDate(d.getDate() + 1)
  return d
}

export const useDashboard = () => {
  const googleCalendarStore = useGoogleCalendarStore()
  const { accounts, allEvents } = storeToRefs(googleCalendarStore)
  const { fetchConnectedAccounts, loadEventsFromDb } = useGoogleCalendar()
  const { loadEvents: loadInternalEvents } = useInternalEvents()

  const notesStore = useNotesStore()
  const { notes } = storeToRefs(notesStore)
  const { deleteNote, refreshNotes } = useNotes()

  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)

  const settingsStore = useSettingsStore()
  const { preferences } = storeToRefs(settingsStore)
  const { getUserPreferences } = useSettings()

  const supabase = useSupabaseClient<Database>()

  const route = useRoute()
  const router = useRouter()

  const todaysEventNotes = ref<Note[]>([])

  const weekRange = computed(() => {
    const start = startOfWeekMonday(new Date())
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { start: start.getTime(), end: end.getTime() }
  })

  const weekEvents = computed(() => {
    const { start, end } = weekRange.value
    return allEvents.value.filter((e) => {
      if (!e?.start_at) return false
      const t = new Date(stripZone(e.start_at)).getTime()
      return t >= start && t < end
    })
  })

  const eventsForChart = computed(() => weekEvents.value.map((e) => ({ start_at: e.start_at })))
  const { buckets } = useWeeklyEventsChart(eventsForChart)

  const todaysEvents = computed(() => {
    const dayStart = startOfToday().getTime()
    const dayEnd = endOfToday().getTime()
    return weekEvents.value
      .filter((e) => {
        const t = new Date(stripZone(e.start_at)).getTime()
        return t >= dayStart && t < dayEnd
      })
      .sort(
        (a, b) =>
          new Date(stripZone(a.start_at)).getTime() - new Date(stripZone(b.start_at)).getTime()
      )
  })

  const notesByEventId = computed(() => {
    const map = new Map<string, Note[]>()
    for (const note of todaysEventNotes.value) {
      if (!note.calendar_event_id) continue
      const list = map.get(note.calendar_event_id) ?? []
      list.push(note)
      map.set(note.calendar_event_id, list)
    }
    return map
  })

  const upcomingTodayCount = computed(() => {
    const now = Date.now()
    return todaysEvents.value.filter((e) => new Date(stripZone(e.start_at)).getTime() >= now).length
  })

  const stats = computed(() => [
    { icon: 'lucide:calendar', value: weekEvents.value.length, label: 'Events This Week' },
    { icon: 'lucide:mail', value: accounts.value.length, label: 'Connected Accounts' },
    { icon: 'lucide:clock', value: upcomingTodayCount.value, label: 'Upcoming Today' },
  ])

  const formatTime = (iso: string) => {
    const d = new Date(stripZone(iso))
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const eventBarColor = (event: CalendarEvent) => {
    const colors = preferences.value?.eventsColors

    if (event.is_internal) {
      return colors?.['internal']?.lightColors.main ?? INTERNAL_CALENDAR_COLOR.lightColors.main
    }

    if (event.google_account_id) {
      const stored = colors?.[event.google_account_id]?.lightColors.main
      if (stored) return stored

      const idx = accounts.value.findIndex((a) => a.id === event.google_account_id)
      const fallback = ACCOUNT_COLORS[idx >= 0 ? idx % ACCOUNT_COLORS.length : 0]
      return fallback?.lightColors.main ?? INTERNAL_CALENDAR_COLOR.lightColors.main
    }

    return INTERNAL_CALENDAR_COLOR.lightColors.main
  }

  const fetchTodaysEventNotes = async (eventIds: string[]) => {
    if (!user.value?.id || eventIds.length === 0) {
      todaysEventNotes.value = []
      return
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.value.id)
      .in('calendar_event_id', eventIds)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[dashboard] todaysEventNotes error:', error)
      return
    }

    todaysEventNotes.value = (data ?? []) as Note[]
  }

  const load = async () => {
    if (!user.value?.id) return

    await Promise.all([
      accounts.value.length === 0 ? fetchConnectedAccounts() : Promise.resolve(),
      preferences.value ? Promise.resolve() : getUserPreferences(user.value.id),
    ])

    await Promise.all([
      loadInternalEvents(),
      ...accounts.value.map((account) => loadEventsFromDb(account.id)),
      notes.value.length === 0 ? refreshNotes() : Promise.resolve(),
    ])

    await fetchTodaysEventNotes(todaysEvents.value.map((e) => e.id))
  }

  const openEventView = (event: CalendarEvent, note?: Note) => {
    router.replace({
      query: {
        ...route.query,
        eventId: event.id,
        eventNoteId: note?.id,
        action: undefined,
        eventStart: undefined,
        eventEnd: undefined,
        eventAllDay: undefined,
        noteId: undefined,
        noteAction: undefined,
      },
    })
  }

  const openNoteInEventSidebar = (note: Note) => {
    if (!note.calendar_event_id) return
    router.replace({
      query: {
        ...route.query,
        eventId: note.calendar_event_id,
        eventNoteId: note.id,
        action: undefined,
        eventStart: undefined,
        eventEnd: undefined,
        eventAllDay: undefined,
        noteId: undefined,
        noteAction: undefined,
      },
    })
  }

  const goCalendar = () => router.push('/app/calendar')

  const openCreateNote = async () => {
    await router.push({
      path: '/app/notes',
      query: {
        ...route.query,
        noteAction: 'create',
        noteId: undefined,
        action: undefined,
      },
    })
  }

  const handleDeleteNote = async (note: Note) => {
    const ok = await deleteNote(note.id)
    if (ok) {
      todaysEventNotes.value = todaysEventNotes.value.filter((n) => n.id !== note.id)
    }
  }

  return {
    accounts,
    notes,
    todaysEventNotes,
    weekEvents,
    todaysEvents,
    notesByEventId,
    upcomingTodayCount,
    buckets,
    stats,
    formatTime,
    eventBarColor,
    openEventView,
    openNoteInEventSidebar,
    openCreateNote,
    goCalendar,
    handleDeleteNote,
    load,
  }
}
