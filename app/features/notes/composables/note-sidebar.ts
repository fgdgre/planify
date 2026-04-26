import { useStorage } from '@vueuse/core'
import { useUserStore } from '@features/auth'
import { mapCalendarEventRowToDisplay } from '@entities/calendar/helpers'
import type { CalendarEventDisplay } from '@entities/calendar'
import type { Database } from '@shared/api/supabase/types/database'
import { notesForm } from './notes-form'
import { useNotes } from './notes'
import type { Note } from '../types'

export type NoteSidebarMode = 'view' | 'edit' | 'create'

export interface NoteSidebarDraft {
  title: string
  content: string
  calendar_event_id: string
}

const emptyDraft = (): NoteSidebarDraft => ({
  title: '',
  content: '',
  calendar_event_id: '',
})

export const useNoteSidebar = () => {
  const route = useRoute()
  const router = useRouter()
  const supabase = useSupabaseClient<Database>()
  const userStore = useUserStore()
  const { fetchNoteById, createNote, updateNote } = useNotes()

  const drafts = useStorage<Record<string, NoteSidebarDraft>>('planify:note-sidebar-drafts', {})

  const isOpen = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const activeMode = ref<NoteSidebarMode | null>(null)
  const activeNoteId = ref<string | null>(null)
  const activeNote = ref<Note | null>(null)
  const formData = ref<NoteSidebarDraft>(emptyDraft())
  const titleError = ref('')
  const linkedEvent = ref<CalendarEventDisplay | null>(null)
  const linkedEventLoading = ref(false)
  const eventPickerOpen = ref(false)
  const eventPickerInitialEventId = ref('')
  const suppressDraftWrite = ref(false)
  const closingFromRoute = ref(false)

  const {
    selectedEventId,
    eventsForSelectedDate,
    eventsLoading,
    selectedDate,
    initEventLinking,
    onMonthChange,
  } = notesForm()

  const queryValue = (key: string) => {
    const value = route.query[key]
    if (Array.isArray(value)) return value.find((item): item is string => typeof item === 'string')
    return typeof value === 'string' ? value : undefined
  }

  const routeMode = computed<NoteSidebarMode | null>(() => {
    const noteId = queryValue('noteId')
    const noteAction = queryValue('noteAction')
    const action = queryValue('action')

    if (noteAction === 'create') return 'create'

    if (noteId) {
      return noteAction === 'edit' || (route.path.includes('/notes') && action === 'edit') ? 'edit' : 'view'
    }

    if (action === 'create' && route.path.includes('/notes')) return 'create'

    return null
  })

  const isEditable = computed(() => activeMode.value !== null)

  const draftKey = computed(() => {
    if (activeMode.value === 'create') return 'create'
    if (activeNoteId.value) return `note:${activeNoteId.value}`
    return ''
  })

  const sidebarTitle = computed(() => {
    if (activeMode.value === 'create') return 'Create note'
    if (activeMode.value === 'edit') return 'Edit note'
    return 'Note'
  })

  const lastActivityText = computed(() => {
    if (!activeNote.value) return ''

    const created = new Date(activeNote.value.created_at)
    const updated = new Date(activeNote.value.updated_at)
    const edited = Math.abs(updated.getTime() - created.getTime()) > 1000
    const date = edited ? updated : created

    return `${edited ? 'Edited' : 'Created'} at ${date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`
  })

  const eventItems = computed(() =>
    eventsForSelectedDate.value.map((event) => ({
      label: event.title,
      value: event.id,
      icon: selectedEventId.value === event.id ? 'lucide:check' : undefined,
    }))
  )

  const replaceQuery = async (updates: Record<string, string | null | undefined>) => {
    const query = { ...route.query }

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        delete query[key]
        return
      }

      query[key] = value
    })

    await router.replace({ query })
  }

  const clearCurrentDraft = () => {
    if (!draftKey.value) return

    const next = { ...drafts.value }
    delete next[draftKey.value]
    drafts.value = next
  }

  const setFormData = (value: NoteSidebarDraft) => {
    suppressDraftWrite.value = true
    formData.value = { ...value }
    selectedEventId.value = value.calendar_event_id
    nextTick(() => {
      suppressDraftWrite.value = false
    })
  }

  const getInitialDraft = (note: Note | null, mode: NoteSidebarMode): NoteSidebarDraft => {
    const key = mode === 'create' ? 'create' : note ? `note:${note.id}` : ''

    if (mode !== 'view' && key && drafts.value[key]) {
      return { ...drafts.value[key] }
    }

    if (!note) return emptyDraft()

    return {
      title: note.title,
      content: note.content,
      calendar_event_id: note.calendar_event_id ?? '',
    }
  }

  const fetchLinkedEvent = async (eventId: string) => {
    linkedEvent.value = null
    linkedEventLoading.value = false

    if (!eventId) return

    linkedEventLoading.value = true

    try {
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (data) {
        linkedEvent.value = mapCalendarEventRowToDisplay(data)
      }
    } finally {
      linkedEventLoading.value = false
    }
  }

  const resetSidebarState = () => {
    activeMode.value = null
    activeNoteId.value = null
    activeNote.value = null
    linkedEvent.value = null
    eventPickerOpen.value = false
    eventPickerInitialEventId.value = ''
    titleError.value = ''
    setFormData(emptyDraft())
  }

  const closeSidebar = async () => {
    if (closingFromRoute.value) return

    closingFromRoute.value = true
    clearCurrentDraft()
    await replaceQuery({
      noteId: null,
      noteAction: null,
      action: routeMode.value === 'create' || queryValue('action') === 'edit' ? null : queryValue('action'),
    })
    resetSidebarState()
    isOpen.value = false
    closingFromRoute.value = false
  }

  const openEventPicker = async () => {
    eventPickerInitialEventId.value = formData.value.calendar_event_id
    eventPickerOpen.value = true

    const initialDate = linkedEvent.value?.start_at
      ? new Date(linkedEvent.value.start_at.replace(/\[.*\]$/, ''))
      : new Date()

    selectedDate.value = initialDate
    selectedEventId.value = formData.value.calendar_event_id
    await initEventLinking(initialDate)
  }

  const discardEventPicker = () => {
    formData.value.calendar_event_id = eventPickerInitialEventId.value
    selectedEventId.value = eventPickerInitialEventId.value
    eventPickerOpen.value = false
  }

  const removeLinkedEvent = () => {
    formData.value.calendar_event_id = ''
    selectedEventId.value = ''
    linkedEvent.value = null
    eventPickerOpen.value = false
    eventPickerInitialEventId.value = ''
  }

  const handleSubmit = async () => {
    if (!isEditable.value) return

    const title = formData.value.title.trim()

    if (!title) {
      titleError.value = 'Title is required'
      return
    }

    titleError.value = ''
    saving.value = true

    if (activeMode.value === 'create') {
      const created = await createNote({
        user_id: userStore.user!.id,
        title,
        content: formData.value.content,
        calendar_event_id: formData.value.calendar_event_id || null,
      }) as Note | undefined

      saving.value = false

      if (created) {
        clearCurrentDraft()
        await replaceQuery({
          noteId: created.id,
          noteAction: null,
          action: null,
        })
      }

      return
    }

    if (!activeNoteId.value) {
      saving.value = false
      return
    }

    const updated = await updateNote(activeNoteId.value, {
      title,
      content: formData.value.content,
      calendar_event_id: formData.value.calendar_event_id || null,
      updated_at: new Date().toISOString(),
    })

    saving.value = false

    if (updated) {
      activeNote.value = updated
      eventPickerOpen.value = false
      eventPickerInitialEventId.value = updated.calendar_event_id ?? ''
      await fetchLinkedEvent(updated.calendar_event_id ?? '')
      clearCurrentDraft()
      await replaceQuery({
        noteId: activeNoteId.value,
        noteAction: null,
        action: null,
      })
    }
  }

  watch(
    () => [routeMode.value, queryValue('noteId')] as const,
    async ([mode, noteId]) => {
      if (!mode) {
        isOpen.value = false
        resetSidebarState()
        return
      }

      isOpen.value = true
      activeMode.value = mode
      activeNoteId.value = noteId ?? null
      activeNote.value = null
      eventPickerOpen.value = false
      titleError.value = ''

      if (mode === 'create') {
        setFormData(getInitialDraft(null, mode))
        linkedEvent.value = null
        linkedEventLoading.value = false
        return
      }

      if (!noteId) return

      loading.value = true
      const note = await fetchNoteById(noteId)
      loading.value = false

      if (!note) {
        await closeSidebar()
        return
      }

      activeNote.value = note
      setFormData(getInitialDraft(note, mode))
      await fetchLinkedEvent(note.calendar_event_id ?? '')
    },
    { immediate: true }
  )

  watch(
    formData,
    (value) => {
      if (suppressDraftWrite.value || !isEditable.value || !draftKey.value) return

      drafts.value = {
        ...drafts.value,
        [draftKey.value]: { ...value },
      }
    },
    { deep: true }
  )

  watch(selectedEventId, (eventId) => {
    formData.value.calendar_event_id = eventId
  })

  watch(isOpen, (open) => {
    if (!open && activeMode.value) {
      closeSidebar()
    }
  })

  return {
    activeMode,
    closeSidebar,
    discardEventPicker,
    eventItems,
    eventPickerOpen,
    eventsForSelectedDate,
    eventsLoading,
    formData,
    handleSubmit,
    isEditable,
    isOpen,
    lastActivityText,
    linkedEvent,
    linkedEventLoading,
    loading,
    onMonthChange,
    openEventPicker,
    removeLinkedEvent,
    saving,
    selectedDate,
    selectedEventId,
    sidebarTitle,
    titleError,
  }
}
