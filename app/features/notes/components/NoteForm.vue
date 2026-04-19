<script setup lang="ts">
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
  'details': isDetailsFilled,
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
        class="flex-1 h-full"
        v-model="content"
        label="Content"
        placeholder="Write your note..."
        resizable
      />
    </div>

    <div
      v-if="activeTab === 'linked-event'"
      class="flex flex-col gap-4 pb-4 flex-1 overflow-hidden"
    >
      <SupaCalendar
        class="px-4 max-w-[350px] mx-auto"
        v-model="selectedDate"
        label="Select date"
        @month-change="onMonthChange"
      />

      <div v-if="selectedDate" class="flex flex-col gap-2 flex-1 overflow-hidden">
        <div class="px-4">
          <p class="text-sm text-secondary">
            Events on {{ selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
          </p>

          <p v-if="eventsLoading" class="text-sm text-tertiary">
            Loading events...
          </p>

          <p v-else-if="eventsForSelectedDate.length === 0" class="text-sm text-tertiary">
            No events on this date
          </p>
        </div>

        <div class="flex flex-col gap-3 flex-1 overflow-auto px-4">
          <div
            v-for="event in eventsForSelectedDate"
            :key="event.id"
            class="flex items-center rounded-md border px-3 py-2 cursor-pointer transition-colors"
            :class="selectedEventId === event.id
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'"
            @click="selectEvent(event)"
          >
            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-sm font-medium truncate">{{ event.title }}</span>
              <span class="text-xs text-secondary">
                {{ formatEventTime(event.start_at, event.all_day) }}
                <template v-if="!event.all_day">
                  - {{ formatEventTime(event.end_at, event.all_day) }}
                </template>
              </span>
            </div>
            <div
              v-if="selectedEventId === event.id"
              class="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0"
            >
              <Icon name="lucide:check" class="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
