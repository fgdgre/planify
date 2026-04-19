<script setup lang="ts">
import { useNotes, useNotesStore } from '@features/notes'
import NoteFormModal from '@features/notes/components/NoteFormModal.vue'

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
  <SupaButton color="primary" @click="isCreateModalOpen = true">
    Create Note
  </SupaButton>

  <NoteFormModal
    v-if="isCreateModalOpen"
    @close="handleModalClose"
  />

  <pre>{{ notesStore.notes }}</pre>
</template>

<style scoped>

</style>
