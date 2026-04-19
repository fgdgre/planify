import type { Note } from '../types'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)

  const setNotes = (data: Note[]) => {
    notes.value = data
  }

  const addNote = (note: Note) => {
    notes.value.push(note)
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const removeNote = (id: string) => {
    notes.value = notes.value.filter((n) => n.id !== id)
  }

  return {
    notes,
    loading,
    setNotes,
    addNote,
    setLoading,
    removeNote,
  }
})
