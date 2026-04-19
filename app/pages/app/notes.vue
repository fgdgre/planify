<script setup lang="ts">
import { useNotes, useNotesStore, NotesItem } from '@features/notes'
import NotesFormModal from '@features/notes/components/NotesFormModal.vue'
import NotesList from "@features/notes/components/NotesList.vue";

definePageMeta({
  layout: 'app',
  title: 'Notes',
})

const { fetchNotes } = useNotes()
const notesStore = useNotesStore()

const isCreateModalOpen = ref(false)

await fetchNotes()

const handleModalClose = () => {
  isCreateModalOpen.value = false
}

</script>

<template>
  <div class="flex flex-col flex-1 p-4 gap-4">
    <SupaButton color="primary" @click="isCreateModalOpen = true">
      Create Note
    </SupaButton>

    <NotesFormModal
      v-if="isCreateModalOpen"
      @close="handleModalClose"
    />

    <NotesList />
  </div>
</template>
