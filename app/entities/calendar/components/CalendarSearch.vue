<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import { useCalendarStore } from '../stores/calendar'
import type { CalendarEventDisplay } from '../types'

const emit = defineEmits<{
  select: [event: CalendarEventDisplay]
}>()

const calendarStore = useCalendarStore()
const { events } = storeToRefs(calendarStore)

const query = ref('')
const isOpen = ref(false)
const wrapperRef = useTemplateRef('wrapperRef')

onClickOutside(wrapperRef, () => {
  isOpen.value = false
})

const stripTz = (iso: string) => iso.replace(/\[.*\]$/, '')

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []

  return events.value
    .filter((e) => {
      const title = e.title?.toLowerCase() ?? ''
      const description = e.description?.toLowerCase() ?? ''
      const location = e.location?.toLowerCase() ?? ''
      return title.includes(q) || description.includes(q) || location.includes(q)
    })
    .sort((a, b) => new Date(stripTz(b.start_at)).getTime() - new Date(stripTz(a.start_at)).getTime())
    .slice(0, 8)
})

const formatEventDate = (iso: string, allDay: boolean): string => {
  const d = new Date(stripTz(iso))
  const opts: Intl.DateTimeFormatOptions = allDay
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
  return d.toLocaleString(undefined, opts)
}

const onFocus = () => {
  isOpen.value = true
}

const onSelect = (event: CalendarEventDisplay) => {
  emit('select', event)
  isOpen.value = false
  query.value = ''
}

const clearQuery = () => {
  query.value = ''
}
</script>

<template>
  <div ref="wrapperRef" class="relative w-full max-w-md">
    <SupaInput
      v-model="query"
      placeholder="Search events"
      leading-icon="heroicons:magnifying-glass"
      @focus="onFocus"
    >
      <template v-if="query" #trailing>
        <SupaButton
          icon="heroicons:x-mark"
          variant="transparent"
          :ui="{ button: 'w-min h-min p-[2px]', icon: 'size-[14px] text-placeholder' }"
          @click="clearQuery"
        />
      </template>
    </SupaInput>

    <div
      v-if="isOpen && query.trim()"
      class="absolute left-0 right-0 top-full mt-1 z-50 bg-background border border-border rounded-md shadow-lg max-h-96 overflow-auto"
    >
      <div
        v-if="!matches.length"
        class="px-3 py-4 text-sm text-muted-foreground text-center"
      >
        No events match "{{ query }}"
      </div>
      <button
        v-for="event in matches"
        :key="event.id"
        type="button"
        class="w-full text-left px-3 py-2 hover:bg-accent border-b border-border last:border-b-0 flex flex-col gap-0.5"
        @click="onSelect(event)"
      >
        <span class="text-sm font-medium truncate">{{ event.title }}</span>
        <span class="text-xs text-muted-foreground">
          {{ formatEventDate(event.start_at, event.all_day) }}
        </span>
      </button>
    </div>
  </div>
</template>
