<script lang="ts" setup>
import DOMPurify from 'dompurify'
import type { CalendarEventDisplay } from '@entities/calendar'
import { useCalendarStore } from '@entities/calendar/stores/calendar'
import { useInternalEvents } from '@entities/calendar/composables/useInternalEvents'
import { useCalendar } from '@entities/calendar/composables/calendar'

const props = defineProps<{
  selectedEvent?: CalendarEventDisplay
}>()

const emit = defineEmits<{
  close: []
}>()

const calendarStore = useCalendarStore()
const { deleteEvent } = useInternalEvents()
const { fetchEvents } = useCalendar()

const deleting = ref(false)

const isInternal = computed(() => props.selectedEvent?.source === 'internal')

const sanitize = (html: string) => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li', 'u'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
})

const formatDate = (isoString: string, allDay: boolean) => {
  const date = new Date(isoString.replace(/\[.*\]$/, ''))

  if (allDay) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formattedTime = computed(() => {
  const event = props.selectedEvent
  if (!event) return ''

  const start = formatDate(event.start_at, event.all_day)
  const end = formatDate(event.end_at, event.all_day)

  if (event.all_day) {
    return start === end ? start : `${start} – ${end}`
  }

  const startDate = new Date(event.start_at.replace(/\[.*\]$/, ''))
  const endDate = new Date(event.end_at.replace(/\[.*\]$/, ''))
  const sameDay = startDate.toDateString() === endDate.toDateString()

  if (sameDay) {
    const time = endDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${start} – ${time}`
  }

  return `${start} – ${end}`
})

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
      <div class="space-y-3 text-sm">
        <!-- Time -->
        <div v-if="formattedTime" class="flex items-start gap-2 text-gray-600">
          <Icon name="lucide:clock" class="mt-0.5 size-4 shrink-0" />
          <span>{{ formattedTime }}</span>
        </div>

        <!-- Location -->
        <div v-if="selectedEvent?.location" class="flex items-start gap-2 text-gray-600">
          <Icon name="lucide:map-pin" class="mt-0.5 size-4 shrink-0" />
          <span>{{ selectedEvent.location }}</span>
        </div>

        <!-- Organizer -->
        <div v-if="selectedEvent?.creator_email" class="flex items-start gap-2 text-gray-600">
          <Icon name="lucide:user" class="mt-0.5 size-4 shrink-0" />
          <span>{{ selectedEvent.creator_email }}</span>
        </div>

        <!-- Description -->
        <div v-if="selectedEvent?.description" class="border-t pt-3 mt-3">
          <div class="prose prose-sm max-w-none text-gray-700" v-html="sanitize(selectedEvent.description)" />
        </div>
      </div>
    </template>

    <template v-if="isInternal" #actions>
      <div class="flex gap-2 w-full">
        <SupaButton color="primary" @click="handleEdit">
          Edit
        </SupaButton>
        <SupaButton color="error" :loading="deleting" @click="handleDelete">
          Delete
        </SupaButton>
      </div>
    </template>
  </SupaModal>
</template>
