<script setup lang="ts">
import EventDetailsPanel from './EventDetailsPanel.vue'
import NotesTabButton from '@features/notes/components/NotesTabButton.vue'
import TabDetails from '@features/notes/components/TabDetails.vue'
import { useEventSidebar } from '../composables/event-sidebar'

const {
  closeSidebar,
  deleting,
  discardNoteDraft,
  errorMessages,
  eventNotes,
  eventPreviewTitle,
  formData,
  handleDelete,
  handleSubmit,
  isEditable,
  isNotePanelOpen,
  isOpen,
  loading,
  openEdit,
  openNote,
  openNotePanel,
  saving,
  selectedEvent,
  sidebarTitle,
  submitLabel,
} = useEventSidebar()
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
      wrapper: isNotePanelOpen ? 'w-[80vw] max-w-[80vw]' : 'w-[520px] max-w-[calc(100vw-48px)]',
      mainContent: 'w-full p-0',
      title: 'border-b border-border h-12',
      footer: 'h-min flex-0',
    }"
  >
    <template #title>
      <div class="flex flex-col">
        <p class="text-sm font-medium text-foreground">{{ sidebarTitle }}</p>
      </div>
    </template>

    <template #content>
      <div v-if="loading" class="flex h-full items-center justify-center text-sm text-placeholder">
        Loading event...
      </div>

      <div v-else-if="!isEditable" class="p-6">
        <EventDetailsPanel
          :selected-event="selectedEvent"
          :event-notes="eventNotes"
          clickable-notes
          show-actions
          :deleting
          @edit="openEdit"
          @delete="handleDelete"
          @note-click="openNote"
        />
      </div>

      <div
        v-else
        class="h-full overflow-hidden"
        :class="isNotePanelOpen ? 'grid grid-cols-[minmax(0,1fr)_350px]' : 'flex flex-col'"
      >
        <section
          v-if="isNotePanelOpen"
          class="flex min-w-0 flex-col gap-4 overflow-hidden border-r border-border p-6"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-medium text-foreground">Linked note</p>
              <p class="truncate text-xs text-placeholder">
                Will be linked to {{ eventPreviewTitle }}
              </p>
            </div>

            <SupaButton
              size="sm"
              variant="transparent"
              @click="discardNoteDraft"
            >
              Discard
            </SupaButton>
          </div>

          <TabDetails
            v-model:title="formData.noteTitle"
            v-model:content="formData.noteContent"
            class="px-0! pb-0! flex-1"
          />
        </section>

        <form
          class="flex min-w-0 flex-col gap-4 overflow-y-auto"
          :class="isNotePanelOpen ? 'bg-placeholder/5 p-4' : 'p-6'"
          @submit.prevent="handleSubmit"
        >
          <SupaInput
            v-model="formData.title"
            label="Title"
            placeholder="Event title"
            :error-message="errorMessages.title"
            :highlight-error="!!errorMessages.title"
            auto-focus
          />

          <SupaTextarea
            v-model="formData.description"
            label="Description"
            placeholder="Add a description..."
            resizable
            :ui="{ textarea: 'min-h-[140px]' }"
          />

          <SupaInput
            v-model="formData.location"
            label="Location"
            placeholder="Add a location..."
          />

          <div class="flex items-center gap-2">
            <SupaSwitch v-model="formData.all_day" label="All day" />
          </div>

          <SupaDatePickerRange
            v-model="formData.date"
            label="Date"
            :error-message="errorMessages.date"
            :highlight-error="!!errorMessages.date"
            :ui="{ modal: 'z-100' }"
          />

          <div v-if="!formData.all_day" class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-foreground">Start time</label>
              <input
                v-model="formData.startTime"
                type="time"
                class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-foreground">End time</label>
              <input
                v-model="formData.endTime"
                type="time"
                class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <NotesTabButton
            v-if="!isNotePanelOpen"
            label="Add note"
            :tab-filled="false"
            :active-tab="false"
            class="w-full flex-none"
            @click="openNotePanel"
          >
            <div class="flex items-center justify-between gap-2">
              <p>Add note</p>
              <SupaIcon name="heroicons:plus" />
            </div>
          </NotesTabButton>
        </form>
      </div>
    </template>

    <template v-if="isEditable" #footer>
      <div class="flex w-full justify-end gap-2">
        <SupaButton color="primary" :loading="saving" @click="handleSubmit">
          {{ submitLabel }}
        </SupaButton>
        <SupaButton variant="transparent" @click="closeSidebar">
          Cancel
        </SupaButton>
      </div>
    </template>
  </SupaSidebar>
</template>
