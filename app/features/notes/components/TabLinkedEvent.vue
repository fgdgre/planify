<script setup lang="ts">
  import type { CalendarEventDisplay } from "@entities/calendar";

  const props = defineProps<{
    eventItems: { label: string; value: string; icon?: string }[]
    loading: boolean
    eventsForSelectedDate: CalendarEventDisplay[]
  }>()

  defineEmits<{
    monthChange: [{ year: number, month: number }]
  }>()

  const selectedDate = defineModel<Date>('selectedDate', { required: true })
  const selectedEventId = defineModel<string>('selectedEventId', { required: true })

  const formatEventTime = (isoString: string, allDay: boolean) => {
    if (allDay) return 'All day'
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const eventsForSelectedDateRef = computed(() => props.eventsForSelectedDate)

  const getEventById = (id: string) => eventsForSelectedDateRef.value.find((event) => event.id === id)

  const handleEventSelect = (id: unknown) => {
    if (typeof id !== 'string') {
      selectedEventId.value = ''
      return
    }

    if(!id) {
      selectedEventId.value = ''
      return
    }

    const event = getEventById(id)
    if (!event) return

    selectedEventId.value = event.id
  }

</script>

<template>
  <div
    class="flex flex-col gap-4 pb-4 flex-1 overflow-hidden"
  >
    <SupaCalendar
      v-model="selectedDate"
      class="px-4 max-w-[350px] mx-auto"
      label="Select date"
      @month-change="(d) => $emit('monthChange', d)"
    />

    <div v-if="selectedDate" class="flex flex-col gap-2 flex-1 overflow-hidden px-4">
      <div>
        <p class="text-sm text-secondary">
          Events on {{ selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
        </p>
      </div>

      <SupaDropdown
        :model-value="selectedEventId || ''"
        :items="eventItems"
        placeholder="Select event"
        clearable
        :loading
        loading-message="Loading events..."
        :is-empty="!loading && eventItems.length === 0"
        empty-message="No events on this date"
        menu-stretch
        :ui="{ menuContent: 'z-100', itemsList: 'max-h-[200px]' }"
        @update:model-value="handleEventSelect"
      >
        <template #menuItem="{ item }">
          <div class="flex items-center gap-3 w-full min-w-0">
            <div class="flex flex-col flex-1 min-w-0">
                <span class="text-sm font-medium truncate">
                  {{ getEventById(item.value)?.title }}
                </span>
              <span class="text-xs text-secondary truncate">
                  {{
                  formatEventTime(
                    getEventById(item.value)!.start_at,
                    getEventById(item.value)!.all_day
                  )
                }}
                  <template v-if="!getEventById(item.value)?.all_day">
                    -
                    {{
                      formatEventTime(
                        getEventById(item.value)!.end_at,
                        getEventById(item.value)!.all_day
                      )
                    }}
                  </template>
                </span>
            </div>
          </div>
        </template>
      </SupaDropdown>
    </div>
  </div>
</template>
