// types
import type { Database, TablesInsert, TablesUpdate } from '@shared/api/supabase/types/database'
// stores
import { useNotesStore } from '../stores/notes'
// hooks
import { useNotification } from "@features/notification";
// validation
import { noteSchema, notesResponseSchema, noteInsertSchema, noteUpdateSchema } from "@features/notes/schemas/note";
import { useUserStore } from "@features/auth";

export const useNotes = () => {
  const notesStore = useNotesStore()
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)

  const supabase = useSupabaseClient<Database>()

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
      .order('created_at', { ascending: false })

    notesStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return
    }

    console.log(data)
    const parsed = notesResponseSchema.safeParse(data)

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid notes response' })
      return
    }

    notesStore.setNotes(parsed.data)
  }

  const fetchNoteById = async (id: string) => {
    if(!userId.value) {
      useNotification().showErrorToast({ title: 'Error', description: 'User not logged in' })
      return null
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId.value)
      .single()

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return null
    }

    const parsed = noteSchema.safeParse(data)

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid note response' })
      return null
    }

    return parsed.data
  }

  const createNote = async (payload: TablesInsert<'notes'>) => {
    const parsed = noteInsertSchema.safeParse(payload)

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid note data' })
      return
    }

    notesStore.setLoading(true)

    const { data, error } = await supabase
      .from('notes')
      .insert(parsed.data)
      .select()
      .single()

    notesStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return
    }

    useNotification().showSuccessToast({ title: 'Success', description: 'Note added successfully' })
    await fetchNotes()

    return data
  }

  const updateNote = async (id: string, payload: TablesUpdate<'notes'>) => {
    if(!userId.value) {
      useNotification().showErrorToast({ title: 'Error', description: 'User not logged in' })
      return null
    }

    const parsed = noteUpdateSchema.safeParse(payload)

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid note data' })
      return null
    }

    notesStore.setLoading(true)

    const { data, error } = await supabase
      .from('notes')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', userId.value)
      .select()
      .single()

    notesStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return null
    }

    useNotification().showSuccessToast({ title: 'Success', description: 'Note updated successfully' })
    await fetchNotes()

    return data
  }

  const deleteNote = async (id: string) => {
    if(!userId.value) {
      useNotification().showErrorToast({ title: 'Error', description: 'User not logged in' })
      return false
    }

    notesStore.setLoading(true)

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId.value)

    notesStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return false
    }

    notesStore.removeNote(id)
    useNotification().showSuccessToast({ title: 'Success', description: 'Note deleted successfully' })
    return true
  }

  return {
    fetchNotes,
    fetchNoteById,
    createNote,
    updateNote,
    deleteNote,
  }
}
