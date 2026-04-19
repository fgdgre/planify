<script setup lang="ts">
import { useNotes } from '@features/notes'
import { useUserStore } from '@features/auth'
import NotesForm from './NotesForm.vue'
import type { NoteFormPayload } from '../composables/useNoteForm'

const emit = defineEmits<{
  close: []
}>()

const userStore = useUserStore()
const { createNote } = useNotes()

const noteForm = ref<InstanceType<typeof NotesForm> | null>(null)
const saving = ref(false)

const onSubmit = async (payload: NoteFormPayload) => {
  saving.value = true

  await createNote({
    ...payload,
    user_id: userStore.user!.id,
  })

  saving.value = false
  emit('close')
}

const handleSubmitClick = () => {
  noteForm.value?.handleSubmit()
}
</script>

<template>
  <SupaModal
    title="Create Note"
    show-close-button
    scrollable-content
    :ui="{ mainContent: 'p-0 min-h-[400px] max-h-[650px]', wrapper: 'min-w-[400px]' }"
    @close="emit('close')"
  >
    <NotesForm ref="noteForm" @submit="onSubmit" />

    <template #actions>
      <SupaButton color="primary" :loading="saving" @click="handleSubmitClick">
        Create
      </SupaButton>
    </template>
  </SupaModal>
</template>
