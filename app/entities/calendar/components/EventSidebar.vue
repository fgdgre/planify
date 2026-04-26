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
  noteTitleError,
  openEdit,
  openNote,
  openNotePanel,
  saving,
  selectedEvent,
  showFooter,
  sidebarTitle,
  submitLabel,
} = useEventSidebar()
</script>

<template>
  <SupaSplitSidebar
    v-model="isOpen"
    prevent-close
    :expanded="isNotePanelOpen"
    :title="sidebarTitle"
    :loading
    loading-text="Loading event..."
    :show-footer="showFooter"
    :saving
    :submit-label="submitLabel"
    @submit="handleSubmit"
    @cancel="closeSidebar"
  >
    <template #main>
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
        :title-error="noteTitleError"
        class="px-0! pb-0! flex-1"
      />
    </template>

    <template #context>
      <form v-if="isEditable" class="flex min-w-0 flex-col gap-4" @submit.prevent="handleSubmit">
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

        <div v-if="eventNotes.length && !isNotePanelOpen" class="space-y-2 border-t border-border pt-3">
          <p class="text-sm font-medium text-foreground">Linked notes</p>
          <button
            v-for="note in eventNotes"
            :key="note.id"
            type="button"
            class="w-full rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary/40"
            @click="openNote(note)"
          >
            <p class="text-sm font-medium text-foreground">{{ note.title }}</p>
            <p v-if="note.content" class="line-clamp-2 text-xs text-placeholder">
              {{ note.content }}
            </p>
          </button>
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

      <EventDetailsPanel
        v-else
        :selected-event="selectedEvent"
        :event-notes="eventNotes"
        clickable-notes
        show-actions
        :deleting
        @edit="openEdit"
        @delete="handleDelete"
        @note-click="openNote"
      />
    </template>
  </SupaSplitSidebar>
</template>
