// types
import type { Database, TablesInsert, TablesUpdate } from '@shared/api/supabase/types/database'
// stores
import { NOTES_PAGE_SIZE, useNotesStore } from '../stores/notes'
// hooks
import { useNotification } from "@features/notification";
// validation
import { noteSchema, notesResponseSchema, noteInsertSchema, noteUpdateSchema } from "@features/notes/schemas/note";
import { useUserStore } from "@features/auth";

const sanitizeSearchTerm = (raw: string) =>
  raw.replace(/[,()*%]/g, ' ').replace(/\s+/g, ' ').trim()

export const useNotes = () => {
  const notesStore = useNotesStore()
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)

  const supabase = useSupabaseClient<Database>()

  const userId = computed(() => user.value?.id)

  const fetchNotes = async ({ reset = false }: { reset?: boolean } = {}) => {
    if (!userId.value) {
      useNotification().showErrorToast({ title: 'Error', description: 'User not logged in' })
      return
    }
    if (notesStore.loading) return
    if (!reset && !notesStore.hasMore && notesStore.notes.length > 0) return

    if (reset) notesStore.resetList()

    notesStore.setLoading(true)

    const page = notesStore.page
    const from = page * NOTES_PAGE_SIZE
    const to = from + NOTES_PAGE_SIZE - 1

    let query = supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId.value)

    const term = sanitizeSearchTerm(notesStore.search)
    if (term) {
      query = query.or(`title.ilike.%${term}%,content_text.ilike.%${term}%`)
    }

    if (notesStore.filters.linked === 'linked') {
      query = query.not('calendar_event_id', 'is', null)
    } else if (notesStore.filters.linked === 'unlinked') {
      query = query.is('calendar_event_id', null)
    }

    if (notesStore.filters.dateFrom) {
      query = query.gte('created_at', notesStore.filters.dateFrom)
    }
    if (notesStore.filters.dateTo) {
      query = query.lte('created_at', notesStore.filters.dateTo)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    notesStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return
    }

    const parsed = notesResponseSchema.safeParse(data ?? [])

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid notes response' })
      return
    }

    if (page === 0) {
      notesStore.setNotes(parsed.data)
    } else {
      notesStore.appendNotes(parsed.data)
    }
    notesStore.setTotal(count ?? parsed.data.length)
    notesStore.setPage(page + 1)
  }

  const loadMoreNotes = async () => {
    if (notesStore.loading || !notesStore.hasMore) return
    await fetchNotes()
  }

  const refreshNotes = async () => {
    await fetchNotes({ reset: true })
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

    const parsedNote = noteSchema.safeParse(data)
    if (parsedNote.success) {
      notesStore.addNote(parsedNote.data)
    } else {
      await refreshNotes()
    }

    useNotification().showSuccessToast({ title: 'Success', description: 'Note added successfully' })

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

    const parsedNote = noteSchema.safeParse(data)
    if (parsedNote.success) {
      notesStore.updateNoteInList(parsedNote.data)
    }

    useNotification().showSuccessToast({ title: 'Success', description: 'Note updated successfully' })

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
    loadMoreNotes,
    refreshNotes,
    fetchNoteById,
    createNote,
    updateNote,
    deleteNote,
  }
}
