<script setup lang="ts">
import { useNotes } from '@features/notes'
import { useUserStore } from '@features/auth'
import { useCalendar } from '@entities/calendar/composables/calendar'
import { useGoogleCalendar } from '@features/integrations/google-calendar'
import type { CalendarEventDisplay } from '@entities/calendar/types'

const emit = defineEmits<{
  close: []
}>()

const userStore = useUserStore()
const { fetchEventsForRange } = useCalendar()
const { fetchConnectedAccounts } = useGoogleCalendar()
const { createNote } = useNotes()

// form state
const title = ref('')
const content = ref('')
const linkEvent = ref(false)
const selectedDate = ref<Date | undefined>(new Date())
const selectedEventId = ref<string | null>(null)
const saving = ref(false)
const eventsCache = reactive<Record<string, CalendarEventDisplay[]>>({})

const monthKey = (year: number, month: number) => `${year}-${month}`

// all cached events flattened
const allEvents = computed(() => Object.values(eventsCache).flat())

// filter cached events by selected date
const eventsForSelectedDate = computed<CalendarEventDisplay[]>(() => {
  if (!selectedDate.value) return []

  const selected = new Date(selectedDate.value)
  // SupaCalendar returns UTC dates — compare in UTC
  const dayStart = Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), selected.getUTCDate())
  const dayEnd = dayStart + 86_400_000 // +24h

  return allEvents.value.filter((event) => {
    const eventStart = new Date(event.start_at).getTime()
    return eventStart >= dayStart && eventStart < dayEnd
  })
})

const formatEventTime = (isoString: string, allDay: boolean) => {
  if (allDay) return 'All day'
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const selectEvent = (event: CalendarEventDisplay) => {
  selectedEventId.value = selectedEventId.value === event.id ? null : event.id
}
const loadMonthEvents = async (year: number, month: number) => {
  const key = monthKey(year, month)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const result = await fetchEventsForRange({
    start: start.toISOString(),
    end: end.toISOString(),
  })

  eventsCache[key] = result
}

// load events for current month when toggle is enabled
watch(linkEvent, async (enabled) => {
  if (!enabled) {
    selectedEventId.value = null
    selectedDate.value = undefined
    Object.keys(eventsCache).forEach((key) => delete eventsCache[key])
    return
  }

  await fetchConnectedAccounts()

  const now = new Date()
  await loadMonthEvents(now.getFullYear(), now.getMonth() + 1)
})

const onMonthChange = (value: { year: number; month: number }) => {
  if (linkEvent.value) {
    loadMonthEvents(value.year, value.month)
  }
}

const handleSubmit = async () => {
  if (!title.value.trim()) return

  saving.value = true

  await createNote({
    title: title.value,
    content: content.value,
    user_id: userStore.user!.id,
    calendar_event_id: linkEvent.value ? selectedEventId.value : null,
  })

  saving.value = false
  emit('close')
}
</script>

<template>
  <SupaModal
    title="Create Note"
    show-close-button
    scrollable-content
    @close="emit('close')"
  >
    <div class="flex flex-col gap-4">
      <SupaInput
        v-model="title"
        label="Title"
        placeholder="Note title"
      />

      <SupaTextarea
        v-model="content"
        label="Content"
        placeholder="Write your note..."
        resizable
      />

      <SupaSwitch
        v-model="linkEvent"
        label="Link to calendar event"
      />

      <template v-if="linkEvent">
        <SupaCalendar
          v-model="selectedDate"
          label="Select date"
          @month-change="onMonthChange"
        />

        <div v-if="selectedDate" class="flex flex-col gap-2">
          <p class="text-sm text-secondary">
            Events on {{ selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
          </p>

          <p v-if="eventsForSelectedDate.length === 0" class="text-sm text-tertiary">
            No events on this date
          </p>

          <div
            v-for="event in eventsForSelectedDate"
            :key="event.id"
            class="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors"
            :class="selectedEventId === event.id
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'"
            @click="selectEvent(event)"
          >
            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-sm font-medium truncate">{{ event.title }}</span>
              <span class="text-xs text-secondary">
                {{ formatEventTime(event.start_at, event.all_day) }}
                <template v-if="!event.all_day">
                  - {{ formatEventTime(event.end_at, event.all_day) }}
                </template>
              </span>
            </div>
            <div
              v-if="selectedEventId === event.id"
              class="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0"
            >
              <Icon name="lucide:check" class="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #actions>
      <SupaButton color="primary" :loading="saving" @click="handleSubmit">
        Create
      </SupaButton>
    </template>
  </SupaModal>
</template>
