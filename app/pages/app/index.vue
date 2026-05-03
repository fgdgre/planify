<script setup lang="ts">
import {
  useGoogleCalendarStore,
  useGoogleCalendar,
  type CalendarEvent,
} from '@features/integrations/google-calendar'
import { useInternalEvents } from '@entities/calendar/composables/useInternalEvents'
import { EventsLineChart, useWeeklyEventsChart } from '@entities/charts'
import { useNotes, useNotesStore, NotesItem } from '@features/notes'
import type { Note } from '@features/notes'
import { useUserStore } from '@features/auth'
import { useSettings, useSettingsStore } from '@features/settings'
import { ACCOUNT_COLORS, INTERNAL_CALENDAR_COLOR } from '@entities/calendar/stores/calendar'
import type { Database } from '@shared/api/supabase/types/database'

definePageMeta({
  title: 'Home',
  layout: 'app',
})

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

const dataLoading = ref(false)
const todaysEventNotes = ref<Note[]>([])

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

const refreshDashboard = async () => {
  if (!user.value?.id) return
  dataLoading.value = true
  try {
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
  } finally {
    dataLoading.value = false
  }

  console.log('[dashboard] loaded:', {
    accounts: accounts.value.length,
    events: allEvents.value.length,
    weekEvents: weekEvents.value.length,
    todaysEvents: todaysEvents.value.length,
    notes: notes.value.length,
    todaysEventNotes: todaysEventNotes.value.length,
    weekRange: {
      start: new Date(weekRange.value.start).toISOString(),
      end: new Date(weekRange.value.end).toISOString(),
    },
    sampleEvent: allEvents.value[0]
      ? {
          id: allEvents.value[0].id,
          start_at: allEvents.value[0].start_at,
          is_internal: allEvents.value[0].is_internal,
        }
      : null,
  })
}

const startOfWeekMonday = (now: Date) => {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

const stripZone = (iso: string) => iso.replace(/\[.*\]$/, '')

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

const todaysEvents = computed(() => {
  const dayStart = startOfToday().getTime()
  const dayEnd = endOfToday().getTime()
  return weekEvents.value
    .filter((e) => {
      const t = new Date(stripZone(e.start_at)).getTime()
      return t >= dayStart && t < dayEnd
    })
    .sort((a, b) => new Date(stripZone(a.start_at)).getTime() - new Date(stripZone(b.start_at)).getTime())
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

const stats = computed(() => [
  { icon: 'lucide:calendar', value: weekEvents.value.length, label: 'Events This Week' },
  { icon: 'lucide:mail', value: accounts.value.length, label: 'Connected Accounts' },
  { icon: 'lucide:clock', value: upcomingTodayCount.value, label: 'Upcoming Today' },
])

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

const openNote = async (note: Note) => {
  await router.push({
    path: '/app/notes',
    query: {
      ...route.query,
      noteId: note.id,
      noteAction: undefined,
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

await refreshDashboard()
</script>

<template>
  <Teleport to="#page-header-actions" defer>
    <SupaButton
      variant="transparent"
      :loading="dataLoading"
      icon="lucide:refresh-cw"
      @click="refreshDashboard"
    >
      Refresh
    </SupaButton>
  </Teleport>

  <div class="flex-1 overflow-auto">
    <section class="dashboard-hero">
      <div class="hero-content">
        <h1 class="hero-title">
          Add your plans for today<br />
          <span class="text-primary">and a couple of easy tips</span>
        </h1>
        <p class="hero-description">
          Choose an account, day, time, write notes and colour according to your mood
        </p>
        <div class="hero-actions">
          <SupaButton
            color="primary"
            class="hero-button !text-white !rounded-[14px] !text-base"
            :ui="{ icon: 'order-last' }"
            icon="lucide:calendar"
            @click="goCalendar"
          >
            Open Calendar
          </SupaButton>
          <SupaButton
            color="primary"
            outline
            class="hero-button !rounded-[14px] !text-base"
            @click="openCreateNote"
          >
            Add Note
          </SupaButton>
        </div>
      </div>

      <div class="chart-card">
        <EventsLineChart :buckets="buckets" />

        <div class="chart-days">
          <div v-for="bucket in buckets" :key="bucket.dayIndex" class="chart-day">
            <span class="chart-day-label">{{ bucket.shortLabel }}</span>
            <span class="chart-day-date">{{ bucket.date }}</span>
          </div>
        </div>

        <div class="chart-footer">Event distribution for this week</div>
      </div>
    </section>

    <section class="dashboard-stats">
      <div
        v-for="(stat, i) in stats"
        :key="stat.label"
        class="stat-card"
      >
        <div
          class="stat-icon"
          :class="i % 2 === 0 ? 'bg-[rgba(150,136,207,0.08)]' : ''"
        >
          <SupaIcon :name="stat.icon" :ui="{ icon: 'size-6 text-foreground' }" />
        </div>
        <p class="stat-value">{{ stat.value }}</p>
        <p class="stat-label">{{ stat.label }}</p>
      </div>
    </section>

    <section class="dashboard-schedule">
      <div class="section-header">
        <h2 class="schedule-title">Today's Schedule</h2>
        <NuxtLink class="section-link" to="/app/calendar">View all</NuxtLink>
      </div>

      <div class="schedule-list">
        <div v-if="todaysEvents.length === 0" class="schedule-empty">
          Nothing scheduled for today.
        </div>

        <div
          v-for="event in todaysEvents"
          :key="event.id"
          class="schedule-row"
          role="button"
          tabindex="0"
          @click="openEventView(event)"
          @keydown.enter.prevent="openEventView(event)"
          @keydown.space.prevent="openEventView(event)"
        >
          <span class="schedule-time">{{ formatTime(event.start_at) }}</span>
          <span class="schedule-bar" :style="{ background: eventBarColor(event) }" />
          <div class="schedule-meta">
            <p class="schedule-event-title">{{ event.title || '(No title)' }}</p>
            <p v-if="event.creator_email" class="schedule-event-email">
              {{ event.creator_email }}
            </p>

            <div
              v-if="notesByEventId.get(event.id)?.length"
              class="schedule-notes"
              @click.stop
            >
              <button
                v-for="note in notesByEventId.get(event.id)"
                :key="note.id"
                type="button"
                class="schedule-note-chip"
                @click="openEventView(event, note)"
              >
                <SupaIcon name="lucide:notebook-pen" :ui="{ icon: 'size-3.5 shrink-0' }" />
                <span class="truncate">{{ note.title }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="notes-column">
        <div class="section-header">
          <h2 class="schedule-title">Notes for today's events</h2>
          <NuxtLink class="section-link" to="/app/notes">View all</NuxtLink>
        </div>

        <div v-if="todaysEventNotes.length === 0" class="schedule-empty">
          No notes linked to today's events.
        </div>

        <div v-else class="notes-grid">
          <NotesItem
            v-for="note in todaysEventNotes"
            :key="note.id"
            :item="note"
            class="bg-white"
            @view="() => openNote(note)"
            @delete="() => handleDeleteNote(note)"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-hero {
  display: flex;
  flex-direction: column;
  gap: 64px;
  padding: 96px 24px;
  background: linear-gradient(135deg, #fff 0%, rgba(150, 136, 207, 0.05) 50%, #fff 100%);
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 768px;
}

.hero-title {
  font-size: 60px;
  line-height: 60px;
  font-weight: 500;
  color: #000;
}

.hero-description {
  font-size: 20px;
  line-height: 28px;
  color: rgba(0, 0, 0, 0.6);
  max-width: 576px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-button {
  padding: 16px 32px 16px 32px !important;
}

.chart-card {
  border: 0.8px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-days {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.chart-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.chart-day-label {
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.4);
  text-align: center;
}

.chart-day-date {
  font-size: 14px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
}

.chart-footer {
  border-top: 0.8px solid rgba(0, 0, 0, 0.1);
  padding-top: 24px;
  font-size: 14px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
}

.dashboard-stats {
  display: flex;
  gap: 24px;
  padding: 64px 24px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 280px;
  border: 0.8px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 36px;
  line-height: 40px;
  font-weight: 500;
  color: #000;
}

.stat-label {
  font-size: 14px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.5);
}

.dashboard-schedule {
  padding: 64px 24px 0;
  background: linear-gradient(180deg, #fff 0%, rgba(150, 136, 207, 0.05) 100%);
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-height: 400px;
}

.schedule-title {
  font-size: 30px;
  line-height: 36px;
  font-weight: 500;
  color: #000;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-link {
  font-size: 14px;
  color: #9688cf;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
}

.schedule-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24.8px;
  background: #fff;
  border: 0.8px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.schedule-row:hover {
  border-color: rgba(150, 136, 207, 0.5);
}

.schedule-row:active {
  transform: scale(0.998);
}

.schedule-time {
  width: 64px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.schedule-bar {
  width: 4px;
  height: 48px;
  border-radius: 26843500px;
  background: #9688cf;
  flex-shrink: 0;
}

.schedule-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.schedule-event-title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-event-email {
  font-size: 14px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.5);
}

.schedule-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.schedule-note-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 220px;
  padding: 4px 10px;
  background: rgba(150, 136, 207, 0.08);
  color: #4d4d4d;
  border-radius: 999px;
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.schedule-note-chip:hover {
  background: rgba(150, 136, 207, 0.18);
}

.schedule-empty {
  padding: 32px;
  border: 1px dashed rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  text-align: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.notes-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 64px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 360px));
  gap: 16px;
  justify-content: start;
}
</style>
