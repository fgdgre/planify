<script setup lang="ts">
import EventDetailsPanel from '@entities/calendar/components/EventDetailsPanel.vue'
import TabLinkedEvent from './TabLinkedEvent.vue'
import { useNoteSidebar } from '../composables/note-sidebar'

const {
  activeMode,
  closeSidebar,
  discardEventPicker,
  eventItems,
  eventPickerOpen,
  eventsForSelectedDate,
  eventsLoading,
  formData,
  handleSubmit,
  isEditable,
  isOpen,
  lastActivityText,
  linkedEvent,
  linkedEventLoading,
  loading,
  onMonthChange,
  openEventPicker,
  removeLinkedEvent,
  saving,
  selectedDate,
  selectedEventId,
  sidebarTitle,
  titleError,
} = useNoteSidebar()
</script>

<template>
  <SupaSplitSidebar
    v-model="isOpen"
    expanded
    prevent-close
    :title="sidebarTitle"
    :subtitle="lastActivityText"
    :loading
    loading-text="Loading note..."
    show-footer
    :saving
    :submit-label="activeMode === 'create' ? 'Create' : 'Save'"
    @submit="handleSubmit"
    @cancel="closeSidebar"
  >
    <template #main>
      <SupaInput
        v-model="formData.title"
        label="Title"
        placeholder="Note title"
        :readonly="!isEditable"
        :error-message="titleError"
        :highlight-error="!!titleError"
        auto-focus
      />

      <div class="border-t border-border" />

      <SupaTextarea
        v-model="formData.content"
        label="Description"
        placeholder="Write your note..."
        :readonly="!isEditable"
        resizable
        :ui="{ wrapper: 'flex-1 min-h-0', textarea: 'h-full min-h-[360px]' }"
      />
    </template>

    <template #context>
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-medium text-foreground">Event</p>

        <div class="flex items-center gap-2">
          <SupaButton
            v-if="eventPickerOpen"
            size="sm"
            variant="transparent"
            @click="discardEventPicker"
          >
            Discard
          </SupaButton>

          <template v-else-if="linkedEvent && isEditable">
            <SupaButton
              size="sm"
              variant="transparent"
              @click="removeLinkedEvent"
            >
              Remove
            </SupaButton>

            <SupaButton
              size="sm"
              variant="transparent"
              @click="openEventPicker"
            >
              Change event
            </SupaButton>
          </template>
        </div>
      </div>

      <div v-if="linkedEventLoading" class="text-sm text-placeholder">
        Loading event...
      </div>

      <TabLinkedEvent
        v-else-if="eventPickerOpen"
        v-model:selected-event-id="selectedEventId"
        v-model:selected-date="selectedDate"
        :event-items="eventItems"
        :loading="eventsLoading"
        :events-for-selected-date="eventsForSelectedDate"
        class="px-0"
        @month-change="onMonthChange"
      />

      <div v-else-if="linkedEvent" class="space-y-3">
        <EventDetailsPanel :selected-event="linkedEvent" show-title />
      </div>

      <div v-else class="flex flex-col gap-3 rounded-md border border-dashed border-border p-4">
        <p class="text-sm text-placeholder">No event linked to this note.</p>
        <SupaButton
          :color="isEditable ? 'primary' : undefined"
          :outline="!isEditable"
          stretch="width"
          @click="openEventPicker"
        >
          Add event
        </SupaButton>
      </div>
    </template>
  </SupaSplitSidebar>
</template>
