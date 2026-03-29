<script lang="ts" setup>
import { watch } from 'vue'

// types
import type { CalendarEventExternal } from '@schedule-x/calendar'
import type { CalendarEvent } from '@features/integrations/google-calendar'

// stores
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";
import { useCalendarStore } from "@entities/calendar/stores/calendar";

// composables
import { useCalendar } from "@entities/calendar";

// components
import { ScheduleXCalendar } from '@schedule-x/vue'

import { createCalendar } from '@schedule-x/calendar'
import '@schedule-x/theme-default/dist/index.css'
import 'temporal-polyfill/global'

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const googleCalendarStore = useGoogleCalendarStore()
const calendarStore = useCalendarStore()
const { calendarConfig, selectedEvent, isEventModalOpen } = storeToRefs(calendarStore)

</script>

<template>
  <div class="flex-1 overflow-auto" ref="calendarContainer">
    <ScheduleXCalendar :calendar-app="calendarConfig" />

    <SupaModal
      v-if="isEventModalOpen"
      @close="calendarStore.selEventModal(false)"
      scrollable-content
      show-close-button
      :title="selectedEvent?.title || 'Event details'"
    >
      <template #default>
        <p>{{ selectedEvent?.creator_email }} - {{ selectedEvent?.end_at }}</p>
        <p>{{ selectedEvent?.location }}</p>
        <p>{{ selectedEvent?.description }}</p>
      </template>
    </SupaModal>
  </div>
</template>
