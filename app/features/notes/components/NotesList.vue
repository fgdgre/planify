<script setup lang="ts">
import { NotesItem, useNotesStore } from "@features/notes";
import type { Note } from '@features/notes'
import { useNotes } from '../composables/notes'

const notesStore = useNotesStore()
const { notes } = storeToRefs(notesStore)
const route = useRoute()
const router = useRouter()
const { deleteNote } = useNotes()

const openNote = async (note: Note) => {
  await router.replace({
    query: {
      ...route.query,
      noteId: note.id,
      noteAction: undefined,
      action: undefined,
    },
  })
}

const handleDelete = async (note: Note) => {
  await deleteNote(note.id)
}
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 overflow-auto">
    <NotesItem
      v-for="note in notes"
      :key="note.id"
      :item="note"
      @view="() => openNote(note)"
      @delete="() => handleDelete(note)"
    />
  </div>
</template>
