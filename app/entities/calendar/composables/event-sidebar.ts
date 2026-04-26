import { useStorage } from '@vueuse/core'
import { useUserStore } from '@features/auth'
import { useNotes, type Note } from '@features/notes'
import { mapCalendarEventRowToDisplay } from '../helpers'
import { useCalendar } from './calendar'
import { useInternalEvents } from './useInternalEvents'
import type { CalendarEventDisplay } from '../types'
import type { Database } from '@shared/api/supabase/types/database'

type EventSidebarMode = 'view' | 'edit' | 'create'

interface EventSidebarFormData {
  title: string
  description: string
  location: string
  date: { start: Date | undefined; end: Date | undefined }
  all_day: boolean
  startTime: string
  endTime: string
  showNoteForm: boolean
  noteId: string
  noteTitle: string
  noteContent: string
}

interface EventSidebarDraft {
  title: string
  description: string
  location: string
  start_at: string
  end_at: string
  all_day: boolean
  startTime: string
  endTime: string
  showNoteForm: boolean
  noteId?: string
  noteTitle: string
  noteContent: string
}

interface EventSidebarNoteDraft {
  title: string
  content: string
}

const isoToDate = (iso?: string): Date | undefined => {
  if (!iso) return undefined
  const date = new Date(iso.replace(/\[.*\]$/, ''))
  return isNaN(date.getTime()) ? undefined : date
}

const dateToTimeStr = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const applyTime = (date: Date, timeStr: string): Date => {
  const [hours = 0, minutes = 0] = timeStr.split(':').map(Number)
  const next = new Date(date.getTime())
  next.setHours(hours, minutes, 0, 0)
  return next
}

const defaultFormData = (start?: Date, end?: Date, allDay = false): EventSidebarFormData => {
  const fallbackStart = start ?? new Date()
  const fallbackEnd = end ?? new Date(fallbackStart.getTime() + 60 * 60 * 1000)

  return {
    title: '',
    description: '',
    location: '',
    date: {
      start: fallbackStart,
      end: fallbackEnd,
    },
    all_day: allDay,
    startTime: dateToTimeStr(fallbackStart),
    endTime: dateToTimeStr(fallbackEnd),
    showNoteForm: false,
    noteId: '',
    noteTitle: '',
    noteContent: '',
  }
}

const serializeFormData = (data: EventSidebarFormData): EventSidebarDraft => ({
  title: data.title,
  description: data.description,
  location: data.location,
  start_at: data.date.start?.toISOString() ?? '',
  end_at: data.date.end?.toISOString() ?? '',
  all_day: data.all_day,
  startTime: data.startTime,
  endTime: data.endTime,
  showNoteForm: data.showNoteForm,
  noteId: data.noteId,
  noteTitle: data.noteTitle,
  noteContent: data.noteContent,
})

const draftToFormData = (draft: EventSidebarDraft): EventSidebarFormData => ({
  title: draft.title,
  description: draft.description,
  location: draft.location,
  date: {
    start: isoToDate(draft.start_at),
    end: isoToDate(draft.end_at),
  },
  all_day: draft.all_day,
  startTime: draft.startTime,
  endTime: draft.endTime,
  showNoteForm: draft.showNoteForm,
  noteId: draft.noteId ?? '',
  noteTitle: draft.noteTitle,
  noteContent: draft.noteContent,
})

export const useEventSidebar = () => {
  const route = useRoute()
  const router = useRouter()
  const supabase = useSupabaseClient<Database>()
  const userStore = useUserStore()
  const { createEvent, updateEvent, deleteEvent } = useInternalEvents()
  const { fetchEvents } = useCalendar()
  const { createNote, updateNote } = useNotes()

  const drafts = useStorage<Record<string, EventSidebarDraft>>('planify:event-sidebar-drafts', {})
  const noteDrafts = useStorage<Record<string, EventSidebarNoteDraft>>('planify:event-sidebar-note-drafts', {})

  const isOpen = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const activeMode = ref<EventSidebarMode | null>(null)
  const activeEventId = ref<string | null>(null)
  const activeNoteId = ref<string | null>(null)
  const selectedEvent = ref<CalendarEventDisplay | null>(null)
  const eventNotes = ref<Note[]>([])
  const formData = ref<EventSidebarFormData>(defaultFormData())
  const errorMessages = ref<Record<string, string>>({})
  const noteTitleError = ref('')
  const suppressDraftWrite = ref(false)
  const suppressNoteDraftWrite = ref(false)
  const closingFromRoute = ref(false)

  const queryValue = (key: string) => {
    const value = route.query[key]
    if (Array.isArray(value)) return value.find((item): item is string => typeof item === 'string')
    return typeof value === 'string' ? value : undefined
  }

  const routeMode = computed<EventSidebarMode | null>(() => {
    const eventId = queryValue('eventId')
    const action = queryValue('action')

    if (eventId) return action === 'edit' ? 'edit' : 'view'
    if (action === 'create' && route.path.includes('/calendar')) return 'create'

    return null
  })

  const isEditable = computed(() => activeMode.value === 'create' || activeMode.value === 'edit')

  const draftKey = computed(() => {
    if (activeMode.value === 'create') return 'create'
    if (activeMode.value === 'edit' && activeEventId.value) return `event:${activeEventId.value}`
    return ''
  })

  const sidebarTitle = computed(() => {
    if (activeMode.value === 'create') return 'New event'
    if (activeMode.value === 'edit') return 'Edit event'
    return selectedEvent.value?.title ?? 'Event details'
  })

  const isNoteFilled = computed(() => formData.value.noteTitle.trim().length > 0)

  const hasNoteInput = computed(() =>
    !!activeNoteId.value || formData.value.noteTitle.trim().length > 0 || formData.value.noteContent.trim().length > 0
  )

  const isNotePanelOpen = computed(() => formData.value.showNoteForm)

  const showFooter = computed(() => isEditable.value || isNotePanelOpen.value)

  const eventPreviewTitle = computed(() => formData.value.title.trim() || selectedEvent.value?.title || 'this event')

  const submitLabel = computed(() => {
    if (activeMode.value === 'view' && isNotePanelOpen.value) {
      return 'Save note'
    }

    if (activeMode.value === 'create') {
      return isNoteFilled.value ? 'Create event and note' : 'Create event'
    }

    return hasNoteInput.value ? 'Save event and note' : 'Save event'
  })

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

  const clearCurrentNoteDraft = () => {
    if (!activeNoteId.value) return

    const next = { ...noteDrafts.value }
    delete next[`note:${activeNoteId.value}`]
    noteDrafts.value = next
  }

  const setFormData = (value: EventSidebarFormData) => {
    suppressDraftWrite.value = true
    formData.value = value
    activeNoteId.value = value.noteId || null
    nextTick(() => {
      suppressDraftWrite.value = false
    })
  }

  const getCreatePrefill = () => {
    const start = isoToDate(queryValue('eventStart'))
    const end = isoToDate(queryValue('eventEnd'))
    const allDay = queryValue('eventAllDay') === 'true'
    return defaultFormData(start, end, allDay)
  }

  const getEventFormData = (event: CalendarEventDisplay): EventSidebarFormData => {
    const start = isoToDate(event.start_at)
    const end = isoToDate(event.end_at)

    return {
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      date: { start, end },
      all_day: event.all_day,
      startTime: start ? dateToTimeStr(start) : '09:00',
      endTime: end ? dateToTimeStr(end) : '10:00',
      showNoteForm: false,
      noteId: '',
      noteTitle: '',
      noteContent: '',
    }
  }

  const getInitialFormData = (event: CalendarEventDisplay | null, mode: EventSidebarMode) => {
    const key = mode === 'create' ? 'create' : event ? `event:${event.id}` : ''

    if (mode !== 'view' && key && drafts.value[key]) {
      return draftToFormData(drafts.value[key])
    }

    if (mode === 'create') return getCreatePrefill()
    if (event) return getEventFormData(event)

    return defaultFormData()
  }

  const fetchEventById = async (id: string) => {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single()

    return data ? mapCalendarEventRowToDisplay(data) : null
  }

  const fetchEventNotes = async (eventId: string) => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('calendar_event_id', eventId)
      .order('created_at', { ascending: false })

    eventNotes.value = data ?? []
    return eventNotes.value
  }

  const resetSidebarState = () => {
    activeMode.value = null
    activeEventId.value = null
    activeNoteId.value = null
    selectedEvent.value = null
    eventNotes.value = []
    errorMessages.value = {}
    noteTitleError.value = ''
    setFormData(defaultFormData())
  }

  const closeSidebar = async () => {
    if (closingFromRoute.value) return

    closingFromRoute.value = true
    clearCurrentDraft()
    clearCurrentNoteDraft()
    await replaceQuery({
      eventId: null,
      eventNoteId: null,
      noteId: null,
      noteAction: null,
      action: routeMode.value === 'create' || routeMode.value === 'edit' ? null : queryValue('action'),
      eventStart: null,
      eventEnd: null,
      eventAllDay: null,
    })
    resetSidebarState()
    isOpen.value = false
    closingFromRoute.value = false
  }

  const openEdit = async () => {
    if (!selectedEvent.value || selectedEvent.value.source !== 'internal') return

    await replaceQuery({
      eventId: selectedEvent.value.id,
      action: 'edit',
      eventStart: null,
      eventEnd: null,
      eventAllDay: null,
    })
  }

  const applyNoteToPanel = (note: Note) => {
    suppressNoteDraftWrite.value = true
    const draft = noteDrafts.value[`note:${note.id}`]

    activeNoteId.value = note.id
    formData.value.showNoteForm = true
    formData.value.noteId = note.id
    formData.value.noteTitle = draft?.title ?? note.title
    formData.value.noteContent = draft?.content ?? note.content
    noteTitleError.value = ''

    nextTick(() => {
      suppressNoteDraftWrite.value = false
    })
  }

  const openNote = async (note: Note) => {
    applyNoteToPanel(note)
    await replaceQuery({
      eventNoteId: note.id,
      noteId: null,
      noteAction: null,
    })
  }

  const openNotePanel = async () => {
    activeNoteId.value = null
    formData.value.showNoteForm = true
    formData.value.noteId = ''
    formData.value.noteTitle = ''
    formData.value.noteContent = ''
    noteTitleError.value = ''
    await replaceQuery({ eventNoteId: null })
  }

  const discardNoteDraft = async () => {
    clearCurrentNoteDraft()
    activeNoteId.value = null
    formData.value.showNoteForm = false
    formData.value.noteId = ''
    formData.value.noteTitle = ''
    formData.value.noteContent = ''
    noteTitleError.value = ''
    await replaceQuery({ eventNoteId: null })
  }

  const handleDelete = async () => {
    if (!selectedEvent.value) return

    deleting.value = true
    const success = await deleteEvent(selectedEvent.value.id)
    deleting.value = false

    if (success) {
      await fetchEvents()
      await closeSidebar()
    }
  }

  const validateNotePanel = () => {
    if (!formData.value.showNoteForm || !hasNoteInput.value) {
      noteTitleError.value = ''
      return true
    }

    if (!formData.value.noteTitle.trim()) {
      noteTitleError.value = 'Title is required'
      return false
    }

    noteTitleError.value = ''
    return true
  }

  const persistNoteForEvent = async (eventId: string) => {
    if (!formData.value.showNoteForm || !hasNoteInput.value) return null

    const title = formData.value.noteTitle.trim()
    const payload = {
      title,
      content: formData.value.noteContent,
      calendar_event_id: eventId,
      updated_at: new Date().toISOString(),
    }

    if (activeNoteId.value) {
      const updated = await updateNote(activeNoteId.value, payload) as Note | null

      if (updated) {
        clearCurrentNoteDraft()
        formData.value.noteId = updated.id
        formData.value.noteTitle = updated.title
        formData.value.noteContent = updated.content
      }

      return updated
    }

    const created = await createNote({
      user_id: userStore.user!.id,
      title,
      content: formData.value.noteContent,
      calendar_event_id: eventId,
    }) as Note | undefined

    if (created) {
      activeNoteId.value = created.id
      formData.value.noteId = created.id
      formData.value.noteTitle = created.title
      formData.value.noteContent = created.content
    }

    return created ?? null
  }

  const handleSubmit = async () => {
    if (activeMode.value === 'view') {
      if (!selectedEvent.value || !validateNotePanel()) return

      saving.value = true
      const savedNote = await persistNoteForEvent(selectedEvent.value.id)
      saving.value = false

      if (savedNote) {
        await fetchEventNotes(selectedEvent.value.id)
        applyNoteToPanel(savedNote)
        await replaceQuery({ eventNoteId: savedNote.id })
      }

      return
    }

    const title = formData.value.title.trim()

    if (!title) {
      errorMessages.value = { ...errorMessages.value, title: 'Title is required' }
      return
    }

    if (!formData.value.date.start || !formData.value.date.end) {
      errorMessages.value = { ...errorMessages.value, date: 'Start and end dates are required' }
      return
    }

    if (!validateNotePanel()) return

    errorMessages.value = {}
    saving.value = true

    const startDate = formData.value.all_day
      ? formData.value.date.start
      : applyTime(formData.value.date.start, formData.value.startTime)

    const endDate = formData.value.all_day
      ? formData.value.date.end
      : applyTime(formData.value.date.end, formData.value.endTime)

    const payload = {
      title: title || null,
      description: formData.value.description || null,
      location: formData.value.location || null,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      all_day: formData.value.all_day,
    }

    if (activeMode.value === 'create') {
      const created = await createEvent(payload) as { id: string } | null
      let savedNote: Note | null = null

      if (created) {
        savedNote = await persistNoteForEvent(created.id)
      }

      saving.value = false

      if (created) {
        clearCurrentDraft()
        await fetchEvents()
        await replaceQuery({
          eventId: created.id,
          action: null,
          eventStart: null,
          eventEnd: null,
          eventAllDay: null,
          eventNoteId: savedNote?.id ?? null,
        })
      }

      return
    }

    if (!selectedEvent.value || selectedEvent.value.source !== 'internal') {
      saving.value = false
      return
    }

    const updated = await updateEvent(selectedEvent.value.id, payload) as unknown
    let savedNote: Note | null = null

    if (updated) {
      savedNote = await persistNoteForEvent(selectedEvent.value.id)
    }

    saving.value = false

    if (updated) {
      clearCurrentDraft()
      await fetchEvents()
      await replaceQuery({
        eventId: selectedEvent.value.id,
        action: null,
        eventStart: null,
        eventEnd: null,
        eventAllDay: null,
        eventNoteId: savedNote?.id ?? activeNoteId.value ?? null,
      })
    }
  }

  watch(
    () => [routeMode.value, queryValue('eventId'), queryValue('eventStart'), queryValue('eventEnd'), queryValue('eventAllDay')] as const,
    async ([mode, eventId, eventStart, eventEnd, eventAllDay], prevValues) => {
      const [prevMode, prevEventId, prevEventStart, prevEventEnd, prevEventAllDay] = prevValues ?? []

      // When only secondary params changed (e.g. eventNoteId) and prevValues exists (not first run),
      // skip the full reset to prevent sidebar flicker.
      const coreParamsChanged = mode !== prevMode
        || eventId !== prevEventId
        || eventStart !== prevEventStart
        || eventEnd !== prevEventEnd
        || eventAllDay !== prevEventAllDay

      if (!coreParamsChanged && prevValues !== undefined) {
        if (mode === 'view') {
          const noteId = queryValue('eventNoteId')
          if (noteId) {
            const note = eventNotes.value.find((n) => n.id === noteId)
            if (note) applyNoteToPanel(note)
          } else if (activeNoteId.value) {
            formData.value.showNoteForm = false
            activeNoteId.value = null
          }
        }
        return
      }

      if (!mode) {
        isOpen.value = false
        resetSidebarState()
        return
      }

      isOpen.value = true
      activeMode.value = mode
      activeEventId.value = eventId ?? null
      activeNoteId.value = null
      selectedEvent.value = null
      eventNotes.value = []
      errorMessages.value = {}
      noteTitleError.value = ''

      if (mode === 'create') {
        setFormData(getInitialFormData(null, mode))
        return
      }

      if (!eventId) return

      loading.value = true
      const event = await fetchEventById(eventId)
      loading.value = false

      if (!event) {
        await closeSidebar()
        return
      }

      selectedEvent.value = event
      activeMode.value = mode === 'edit' && event.source !== 'internal' ? 'view' : mode
      setFormData(getInitialFormData(event, activeMode.value))
      const notes = await fetchEventNotes(event.id)
      const selectedNoteId = queryValue('eventNoteId') || formData.value.noteId
      const selectedNote = selectedNoteId ? notes.find((note) => note.id === selectedNoteId) : null

      if (selectedNote) {
        applyNoteToPanel(selectedNote)
      } else if (queryValue('eventNoteId')) {
        await replaceQuery({ eventNoteId: null })
      }

      if (mode === 'edit' && event.source !== 'internal') {
        await replaceQuery({ action: null })
      }
    },
    { immediate: true }
  )

  watch(
    formData,
    (value) => {
      if (suppressDraftWrite.value || !isEditable.value || !draftKey.value) return

      drafts.value = {
        ...drafts.value,
        [draftKey.value]: serializeFormData(value),
      }
    },
    { deep: true }
  )

  watch(
    () => [activeNoteId.value, formData.value.noteTitle, formData.value.noteContent, formData.value.showNoteForm] as const,
    ([noteId, noteTitle, noteContent, showNoteForm]) => {
      if (suppressNoteDraftWrite.value || !noteId || !showNoteForm) return

      noteDrafts.value = {
        ...noteDrafts.value,
        [`note:${noteId}`]: {
          title: noteTitle,
          content: noteContent,
        },
      }
    }
  )

  watch(isOpen, (open) => {
    if (!open && activeMode.value) {
      closeSidebar()
    }
  })

  return {
    activeMode,
    closeSidebar,
    deleting,
    discardNoteDraft,
    errorMessages,
    eventNotes,
    eventPreviewTitle,
    formData,
    handleDelete,
    handleSubmit,
    hasNoteInput,
    isEditable,
    isNoteFilled,
    isNotePanelOpen,
    isOpen,
    loading,
    noteTitleError,
    openEdit,
    openNote,
    openNotePanel,
    saving,
    selectedEvent,
    showFooter,
    sidebarTitle,
    submitLabel,
  }
}
