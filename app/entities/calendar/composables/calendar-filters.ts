import { useCalendarStore } from '../stores/calendar'
import { useCalendarFiltersStore } from '../stores/calendar-filters'
import { isEventVisible, eventMatchesSearch } from '../helpers/filters'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import type { CalendarEventDisplay } from '../types'

/** The loaded events after the sidebar toggles, plus which of them match the search. */
export const useCalendarFilters = () => {
  const calendarStore = useCalendarStore()
  const googleCalendarStore = useGoogleCalendarStore()
  const filtersStore = useCalendarFiltersStore()

  const { events } = storeToRefs(calendarStore)
  const { hiddenSources, searchQuery } = storeToRefs(filtersStore)

  const isSearching = computed(() => searchQuery.value.trim().length > 0)

  const visibleEvents = computed(() => events.value.filter((e) => isEventVisible(e, hiddenSources.value)))

  const accountNameOf = (event: CalendarEventDisplay) => {
    const account = googleCalendarStore.accounts.find((a) => a.id === event.sourceAccountId)
    return [account?.display_name, account?.email].filter(Boolean).join(' ')
  }

  const matchesSearch = (event: CalendarEventDisplay) => {
    return eventMatchesSearch(event, searchQuery.value, accountNameOf(event))
  }

  const matchingEvents = computed(() => visibleEvents.value.filter(matchesSearch))

  return { isSearching, visibleEvents, matchingEvents, matchesSearch }
}
