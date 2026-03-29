<script lang="ts" setup>
import DOMPurify from 'dompurify'
import type { CalendarEventDisplay } from '@entities/calendar'

const props = defineProps<{
  title?: string
  selectedEvent?: CalendarEventDisplay
}>()

defineEmits<{
  close: [],
}>()

const sanitize = (html: string) => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li', 'u'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
})

const formatDate = (isoString: string, allDay: boolean) => {
  // Strip Temporal ZonedDateTime bracket annotation e.g. "[UTC]"
  const date = new Date(isoString.replace(/\[.*\]$/, ''))

  if (allDay) {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return date.toLocaleString(undefined, {
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
  console.log(event)
  if (!event) return ''

  const start = formatDate(event.start_at, event.all_day)
  const end = formatDate(event.end_at, event.all_day)
  console.log(event.start_at)
  console.log(start, end)

  if (event.all_day) {
    return start === end ? start : `${start} – ${end}`
  }

  // Same day: "Sat, Mar 29, 2026, 10:00 AM – 11:30 AM"
  const startDate = new Date(event.start_at)
  const endDate = new Date(event.end_at)
  const sameDay = startDate.toDateString() === endDate.toDateString()

  if (sameDay) {
    const time = endDate.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${start} – ${time}`
  }

  return `${start} – ${end}`
})
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
  </SupaModal>
</template>
