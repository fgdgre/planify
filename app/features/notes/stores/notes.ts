import type { Note } from '../types'

export type NotesLinkedFilter = 'all' | 'linked' | 'unlinked'

export interface NotesFilters {
  linked: NotesLinkedFilter
  dateFrom: string | null
  dateTo: string | null
}

export const NOTES_PAGE_SIZE = 20

const emptyFilters = (): NotesFilters => ({
  linked: 'all',
  dateFrom: null,
  dateTo: null,
})

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const page = ref(0)
  const total = ref(0)
  const search = ref('')
  const filters = ref<NotesFilters>(emptyFilters())

  const hasMore = computed(() => notes.value.length < total.value)

  const hasActiveFilters = computed(() => {
    const f = filters.value
    return search.value.trim().length > 0
      || f.linked !== 'all'
      || !!f.dateFrom
      || !!f.dateTo
  })

  const setNotes = (data: Note[]) => {
    notes.value = data
  }

  const appendNotes = (data: Note[]) => {
    notes.value.push(...data)
  }

  const addNote = (note: Note) => {
    notes.value.unshift(note)
    total.value += 1
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const removeNote = (id: string) => {
    const before = notes.value.length
    notes.value = notes.value.filter((n) => n.id !== id)
    if (notes.value.length !== before) total.value = Math.max(0, total.value - 1)
  }

  const updateNoteInList = (note: Note) => {
    const idx = notes.value.findIndex((n) => n.id === note.id)
    if (idx !== -1) notes.value[idx] = note
  }

  const setPage = (value: number) => {
    page.value = value
  }

  const setTotal = (value: number) => {
    total.value = value
  }

  const setSearch = (value: string) => {
    search.value = value
  }

  const setFilters = (value: Partial<NotesFilters>) => {
    filters.value = { ...filters.value, ...value }
  }

  const resetFilters = () => {
    search.value = ''
    filters.value = emptyFilters()
  }

  const resetList = () => {
    notes.value = []
    page.value = 0
    total.value = 0
  }

  return {
    notes,
    loading,
    page,
    total,
    search,
    filters,
    hasMore,
    hasActiveFilters,
    setNotes,
    appendNotes,
    addNote,
    setLoading,
    removeNote,
    updateNoteInList,
    setPage,
    setTotal,
    setSearch,
    setFilters,
    resetFilters,
    resetList,
  }
})
