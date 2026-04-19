<script setup lang="ts">
import { computed } from 'vue'
import { useNoteForm, type NoteFormPayload, type NoteFormTab } from '../composables/useNoteForm'

const emit = defineEmits<{
  submit: [payload: NoteFormPayload]
}>()

const {
  activeTab,
  title,
  content,
  isValid,
  isDetailsFilled,
  isLinkedEventFilled,
  getPayload,
  selectedDate,
  selectedEventId,
  eventsForSelectedDate,
  eventsLoading,
  selectEvent,
  initEventLinking,
  onMonthChange,
} = useNoteForm()

const tabFilled: Record<NoteFormTab, Ref<boolean>> = {
  details: isDetailsFilled,
  'linked-event': isLinkedEventFilled,
}

const tabs: { key: NoteFormTab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'linked-event', label: 'Linked event' },
]

const switchTab = async (tab: NoteFormTab) => {
  activeTab.value = tab

  if (tab === 'linked-event') {
    await initEventLinking()
  }
}

const formatEventTime = (isoString: string, allDay: boolean) => {
  if (allDay) return 'All day'
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const eventItems = computed(() =>
  eventsForSelectedDate.value.map((event) => ({
    label: event.title,
    value: event.id,
    icon: selectedEventId.value === event.id ? 'lucide:check' : undefined,
  }))
)

const getEventById = (id: string) =>
  eventsForSelectedDate.value.find((event) => event.id === id)

const handleEventSelect = (id: string | null) => {
  if(!id) {
    selectedEventId.value = null
    return
  }

  const event = getEventById(id)
  if (!event) return
  selectEvent(event)
}

const handleSubmit = () => {
  if (!isValid.value) return
  emit('submit', getPayload())
}

defineExpose({ handleSubmit, isValid })
</script>

<template>
  <div class="flex flex-col gap-4 flex-1 overflow-hidden">
    <div class="flex gap-1 rounded-md pt-4 px-4">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors"
        :class="[
          tabFilled[tab.key].value
            ? 'bg-primary/60 border-border! text-foreground'
            : 'bg-placeholder/20 border-transparent text-secondary',
          activeTab === tab.key
            ? 'border border-placeholder!'
            : 'text-placeholder',
        ]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      v-if="activeTab === 'details'"
      class="flex flex-col gap-4 px-4 pb-4"
    >
      <SupaInput
        v-model="title"
        label="Title"
        placeholder="Note title"
      />

      <SupaTextarea
        v-model="content"
        class="min-h-[320px]"
        label="Content"
        placeholder="Write your note..."
      />
    </div>

    <div
      v-if="activeTab === 'linked-event'"
      class="flex flex-col gap-4 pb-4 flex-1 overflow-hidden"
    >
      <SupaCalendar
        v-model="selectedDate"
        class="px-4 max-w-[350px] mx-auto"
        label="Select date"
        @month-change="onMonthChange"
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
          :loading="eventsLoading"
          loading-message="Loading events..."
          :is-empty="!eventsLoading && eventItems.length === 0"
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
  </div>
</template>
