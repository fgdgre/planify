<script lang="ts" setup>
import type { CalendarEventDisplay } from '@entities/calendar'
import type { Note } from '@features/notes'
import { useCalendarStore } from '@entities/calendar/stores/calendar'
import { useInternalEvents } from '@entities/calendar/composables/useInternalEvents'
import { useCalendar } from '@entities/calendar/composables/calendar'
import EventDetailsPanel from './EventDetailsPanel.vue'

const props = defineProps<{
  selectedEvent?: CalendarEventDisplay | null
}>()

const emit = defineEmits<{
  close: []
}>()

const supabase = useSupabaseClient()
const calendarStore = useCalendarStore()
const { deleteEvent } = useInternalEvents()
const { fetchEvents } = useCalendar()

const deleting = ref(false)
const eventNotes = ref<Note[]>([])

const fetchEventNotes = async () => {
  if (!props.selectedEvent) return

  const { data } = await supabase
    .from('notes')
    .select('*')
    .eq('calendar_event_id', props.selectedEvent.id)
    .order('created_at', { ascending: false })

  if (data) eventNotes.value = data
}

fetchEventNotes()

const handleEdit = () => {
  if (!props.selectedEvent) return
  emit('close')
  calendarStore.openEditModal(props.selectedEvent)
}

const handleDelete = async () => {
  if (!props.selectedEvent) return
  deleting.value = true
  const success = await deleteEvent(props.selectedEvent.id)
  deleting.value = false
  if (success) {
    emit('close')
    await fetchEvents()
  }
}
</script>

<template>
  <SupaModal
    scrollable-content
    show-close-button
    :title="selectedEvent?.title || 'Event details'"
    @close="$emit('close')"
  >
    <template #default>
      <EventDetailsPanel
        :selected-event="selectedEvent"
        :event-notes="eventNotes"
        show-actions
        :deleting
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </template>
  </SupaModal>
</template>
