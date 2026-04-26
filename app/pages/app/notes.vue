<script setup lang="ts">
import { useNotes } from '@features/notes'
import NotesList from "@features/notes/components/NotesList.vue";

definePageMeta({
  layout: 'app',
  title: 'Notes',
})

const { fetchNotes } = useNotes()
const route = useRoute()
const router = useRouter()

await fetchNotes()

const openCreateNote = async () => {
  await router.replace({
    query: {
      ...route.query,
      noteId: undefined,
      noteAction: 'create',
      action: undefined,
    },
  })
}

</script>

<template>
  <div class="flex flex-col flex-1 p-4 gap-4">
    <SupaButton color="primary" @click="openCreateNote">
      Create Note
    </SupaButton>

    <NotesList />
  </div>
</template>
