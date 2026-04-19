<script setup lang="ts">
import { NotesItem, useNotesStore } from "@features/notes";

const notesStore = useNotesStore()
const { notes } = storeToRefs(notesStore)

const handleDelete = (note: Note) => {
  console.log('delete', note)
}
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 overflow-auto">
    <NotesItem
      v-for="note in notes"
      :key="note.id"
      :item="note"
      @delete="() => handleDelete(note)"
    />
  </div>
</template>
