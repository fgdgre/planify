<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import { useCalendarFiltersStore } from '../stores/calendar-filters'
import { useCalendarFilters } from '../composables/calendar-filters'
import { useTourTarget } from '@shared/api/demo'
import { calendarSearchControls, registerControls } from '../composables/tour-controls'
import type { CalendarEventDisplay } from '../types'

const emit = defineEmits<{
  select: [event: CalendarEventDisplay]
}>()

const filtersStore = useCalendarFiltersStore()
const { searchQuery: query } = storeToRefs(filtersStore)
const { matchingEvents } = useCalendarFilters()

const isOpen = ref(false)
const wrapperRef = useTemplateRef('wrapperRef')
const resultsRef = useTemplateRef('resultsRef')
useTourTarget('searchBox', wrapperRef)
useTourTarget('searchResults', resultsRef)

onClickOutside(wrapperRef, () => {
  isOpen.value = false
})

const stripTz = (iso: string) => iso.replace(/\[.*\]$/, '')

const matches = computed(() => {
  return [...matchingEvents.value]
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

const clearQuery = () => {
  filtersStore.clearSearch()
}

const onSelect = (event: CalendarEventDisplay) => {
  emit('select', event)
  isOpen.value = false
  clearQuery()
}

const onEnter = () => {
  const first = matches.value[0]
  if (first) onSelect(first)
}

const onEscape = () => {
  isOpen.value = false
  clearQuery()
}

registerControls(calendarSearchControls, {
  setQuery: (value) => {
    filtersStore.setSearchQuery(value)
    isOpen.value = value.trim().length > 0
  },
})
</script>

<template>
  <div ref="wrapperRef" class="relative w-full max-w-md">
    <SupaInput
      v-model="query"
      placeholder="Search events"
      leading-icon="heroicons:magnifying-glass"
      :ui="{ input: query ? 'pr-28' : '' }"
      @focus="onFocus"
      @keydown.enter="onEnter"
      @keydown.esc="onEscape"
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

    <span
      v-if="query.trim()"
      class="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap pointer-events-none"
      data-testid="search-count"
    >
      {{ matchingEvents.length }} {{ matchingEvents.length === 1 ? 'result' : 'results' }}
    </span>

    <div
      v-if="isOpen && query.trim()"
      ref="resultsRef"
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
