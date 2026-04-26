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
  saving,
  selectedDate,
  selectedEventId,
  sidebarTitle,
  titleError,
} = useNoteSidebar()
</script>

<template>
  <SupaSidebar
    v-model="isOpen"
    position="right"
    theme="white"
    with-close-button
    no-padding
    prevent-close
    :ui="{
      wrapper: 'w-[80vw] max-w-[80vw]',
      mainContent: 'w-full p-0',
      title: 'border-b border-border h-12',
      footer: 'h-min flex-0'
    }"
  >
    <template #title>
      <div class="flex flex-col">
        <p class="text-sm font-medium text-foreground">{{ sidebarTitle }}</p>
        <p v-if="lastActivityText" class="text-xs text-placeholder">{{ lastActivityText }}</p>
      </div>
    </template>

    <template #content>
      <div v-if="loading" class="flex h-full items-center justify-center text-sm text-placeholder">
        Loading note...
      </div>

      <div v-else class="grid h-full grid-cols-[minmax(0,1fr)_350px] overflow-hidden">
        <section class="flex min-w-0 flex-col gap-4 overflow-hidden border-r border-border p-6">
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
        </section>

        <aside class="flex min-w-0 flex-col gap-4 overflow-y-auto bg-placeholder/5 p-4">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-foreground">Event</p>

            <SupaButton
              v-if="eventPickerOpen"
              size="sm"
              variant="transparent"
              @click="discardEventPicker"
            >
              Discard
            </SupaButton>

            <SupaButton
              v-else-if="linkedEvent && isEditable"
              size="sm"
              variant="transparent"
              @click="openEventPicker"
            >
              Change event
            </SupaButton>
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
              v-if="isEditable"
              color="primary"
              stretch="width"
              @click="openEventPicker"
            >
              Add event
            </SupaButton>
            <SupaButton
              v-else
              outline
              stretch="width"
              @click="openEventPicker"
            >
              Add event
            </SupaButton>
          </div>
        </aside>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <SupaButton
          color="primary"
          :loading="saving"
          @click="handleSubmit"
        >
          {{ activeMode === 'create' ? 'Create' : 'Save' }}
        </SupaButton>
        <SupaButton variant="transparent" @click="closeSidebar">
          Cancel
        </SupaButton>
      </div>
    </template>
  </SupaSidebar>
</template>
