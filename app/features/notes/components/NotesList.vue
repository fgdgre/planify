<script setup lang="ts">
import { NotesItem, useNotesStore } from "@features/notes";
import type { Note } from '@features/notes'
import { useNotes } from '../composables/notes'

const notesStore = useNotesStore()
const { notes, loading, total, hasMore, hasActiveFilters } = storeToRefs(notesStore)
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

const showInitialSkeleton = computed(() => loading.value && notes.value.length === 0)
const showEmptyState = computed(() => !loading.value && notes.value.length === 0)
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <div v-if="total > 0" class="text-xs text-placeholder">
      Showing {{ notes.length }} of {{ total }}
    </div>

    <div
      v-if="!showEmptyState"
      class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
    >
      <NotesItem
        v-for="note in notes"
        :key="note.id"
        :item="note"
        @view="() => openNote(note)"
        @delete="() => handleDelete(note)"
      />

      <template v-if="showInitialSkeleton">
        <SupaSkeleton
          v-for="n in 6"
          :key="`skeleton-${n}`"
          class="h-[180px] rounded-[14px]"
        />
      </template>
    </div>

    <div
      v-if="showEmptyState"
      class="flex flex-1 items-center justify-center rounded-md border border-dashed border-border p-10 text-center text-sm text-placeholder"
    >
      <p v-if="hasActiveFilters">
        No notes match your search or filters.
      </p>
      <p v-else>
        No notes yet. Create your first one to get started.
      </p>
    </div>

    <div v-if="hasMore && loading" class="flex items-center justify-center py-4">
      <SupaSpinner />
    </div>
  </div>
</template>
