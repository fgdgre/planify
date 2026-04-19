// types
import type { TablesInsert } from '@shared/api/supabase/types/database'
// stores
import { useNotesStore } from '../stores/notes'
// hooks
import { useNotification } from "@features/notification";
// validation
import { notesResponseSchema, noteInsertSchema } from "@features/notes/schemas/note";
import { useUserStore } from "@features/auth";

export const useNotes = () => {
  const notesStore = useNotesStore()
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)

  const supabase = useSupabaseClient()

  const userId = computed(() => user.value?.id)

  const fetchNotes = async () => {
    if(!userId.value) {
      useNotification().showErrorToast({ title: 'Error', description: 'User not logged in' })
      return
    }
    notesStore.setLoading(true)

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId.value)

    notesStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return
    }

    console.log(data)
    const parsed = notesResponseSchema.safeParse(data)

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid notes response' })
      // return
    }

    notesStore.setNotes(parsed.data)
  }

  const createNote = async (payload: TablesInsert<'notes'>) => {
    const parsed = noteInsertSchema.safeParse(payload)

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid note data' })
      return
    }

    notesStore.setLoading(true)

    const { error } = await supabase
      .from('notes')
      .insert(parsed.data)

    notesStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return
    }

    useNotification().showSuccessToast({ title: 'Success', description: 'Note added successfully' })
    await fetchNotes()
  }

  return {
    fetchNotes,
    createNote,
  }
}
