<script setup lang="ts">
import { computed } from 'vue'
import { notesForm, type NoteFormPayload, type NoteFormTab } from '../composables/notes-form'
import TabDetails from "@features/notes/components/TabDetails.vue";
import TabLinkedEvent from "@features/notes/components/TabLinkedEvent.vue";
import NotesTabButton from "@features/notes/components/NotesTabButton.vue";

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
  selectedEventId,
  eventsForSelectedDate,
  eventsLoading,
  selectedDate,
  initEventLinking,
  onMonthChange,
} = notesForm()

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

const eventItems = computed(() =>
  eventsForSelectedDate.value.map((event) => ({
    label: event.title,
    value: event.id,
    icon: selectedEventId.value === event.id ? 'lucide:check' : undefined,
  }))
)

const getEventById = (id: string) => eventsForSelectedDate.value.find((event) => event.id === id)

const handleSubmit = () => {
  if (!isValid.value) return
  emit('submit', getPayload())
}

defineExpose({ handleSubmit, isValid })
</script>

<template>
  <div class="flex flex-col gap-4 flex-1 overflow-hidden">
    <div class="flex gap-1 rounded-md pt-4 px-4">
      <NotesTabButton
        v-for="tab in tabs"
        :key="tab.key"
        :label="tab.label"
        :tab-filled="tabFilled[tab.key].value"
        :active-tab="activeTab === tab.key"
        @click="switchTab(tab.key)"
      />
    </div>

    <TabDetails
      v-if="activeTab === 'details'"
      v-model:title="title"
      v-model:content="content"
    />

    <TabLinkedEvent
      v-if="activeTab === 'linked-event'"
      v-model:selected-event-id="selectedEventId"
      v-model:selected-date="selectedDate"
      :event-items="eventItems"
      :loading="eventsLoading"
      :eventsForSelectedDate
      @month-change="onMonthChange"
    />
  </div>
</template>
