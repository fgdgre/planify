<script lang="ts" setup>
import DOMPurify from 'dompurify'
import type { CalendarEventDisplay } from '@entities/calendar'
import type { Note } from '@features/notes'

const props = withDefaults(
  defineProps<{
    selectedEvent?: CalendarEventDisplay | null
    eventNotes?: Note[]
    showActions?: boolean
    showTitle?: boolean
    clickableNotes?: boolean
    deleting?: boolean
  }>(),
  {
    eventNotes: () => [],
  }
)

const emit = defineEmits<{
  edit: []
  delete: []
  noteClick: [note: Note]
}>()

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
    return start === end ? start : `${start} - ${end}`
  }

  const startDate = new Date(event.start_at.replace(/\[.*\]$/, ''))
  const endDate = new Date(event.end_at.replace(/\[.*\]$/, ''))
  const sameDay = startDate.toDateString() === endDate.toDateString()

  if (sameDay) {
    const time = endDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${start} - ${time}`
  }

  return `${start} - ${end}`
})
</script>

<template>
  <div class="space-y-3 text-sm">
    <div v-if="!selectedEvent" class="text-placeholder">
      Event details are not available.
    </div>

    <template v-else>
      <p v-if="showTitle" class="text-base font-medium text-foreground">
        {{ selectedEvent.title }}
      </p>

      <div v-if="formattedTime" class="flex items-start gap-2 text-gray-600">
        <Icon name="lucide:clock" class="mt-0.5 size-4 shrink-0" />
        <span>{{ formattedTime }}</span>
      </div>

      <div v-if="selectedEvent.location" class="flex items-start gap-2 text-gray-600">
        <Icon name="lucide:map-pin" class="mt-0.5 size-4 shrink-0" />
        <span>{{ selectedEvent.location }}</span>
      </div>

      <div v-if="selectedEvent.creator_email" class="flex items-start gap-2 text-gray-600">
        <Icon name="lucide:user" class="mt-0.5 size-4 shrink-0" />
        <span>{{ selectedEvent.creator_email }}</span>
      </div>

      <div v-if="selectedEvent.html_link" class="flex items-start gap-2 text-blue-600">
        <a :href="selectedEvent.html_link" target="_blank" rel="noreferrer">Link to original event</a>
      </div>

      <div v-if="selectedEvent.description" class="border-t pt-3 mt-3">
        <div class="prose prose-sm max-w-none text-gray-700" v-html="sanitize(selectedEvent.description)" />
      </div>

      <div v-if="eventNotes.length" class="border-t pt-3 mt-3 space-y-2">
        <div class="flex items-center gap-1.5 text-gray-500">
          <Icon name="lucide:notebook-pen" class="size-4 shrink-0" />
          <span class="font-medium">Notes</span>
        </div>

        <button
          v-for="note in eventNotes"
          :key="note.id"
          type="button"
          class="w-full rounded-md border border-border bg-placeholder/10 p-3 space-y-1 text-left"
          :class="clickableNotes && 'cursor-pointer transition-colors hover:border-primary/40 hover:bg-background'"
          @click="clickableNotes && emit('noteClick', note)"
        >
          <p class="text-sm font-medium text-foreground">{{ note.title }}</p>
          <p v-if="note.content" class="text-xs text-placeholder line-clamp-3">{{ note.content }}</p>
        </button>
      </div>

      <div v-if="showActions && isInternal" class="flex gap-2 w-full border-t pt-3 mt-3">
        <SupaButton color="primary" @click="emit('edit')">
          Edit
        </SupaButton>
        <SupaButton color="error" :loading="deleting" @click="emit('delete')">
          Delete
        </SupaButton>
      </div>
    </template>
  </div>
</template>
