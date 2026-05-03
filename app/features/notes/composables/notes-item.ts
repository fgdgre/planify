import type { Ref } from 'vue'
import type { Database } from '@shared/api/supabase/types/database'
import type { Note } from '../types'

export const useNotesItem = (note: Ref<Note>) => {
  const supabase = useSupabaseClient<Database>()

  const linkedEvent = ref<{ title: string; start_at: string } | null>(null)

  const fetchLinkedEvent = async () => {
    linkedEvent.value = null

    if (!note.value.calendar_event_id) return

    const { data } = await supabase
      .from('calendar_events')
      .select('title, start_at')
      .eq('id', note.value.calendar_event_id)
      .single()

    if (data) {
      linkedEvent.value = {
        title: data.title ?? '(No title)',
        start_at: data.start_at,
      }
    }
  }

  watch(
    () => note.value.calendar_event_id,
    () => {
      fetchLinkedEvent()
    },
    { immediate: true }
  )

  const formattedEventDate = computed(() => {
    if (!linkedEvent.value?.start_at) return ''

    return new Date(linkedEvent.value.start_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  })

  const formattedNoteDate = computed(() => {
    if (!note.value.created_at) return ''

    return new Date(note.value.created_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  })

  const cardItemActions = [
    {
      value: 'view',
      label: 'View',
      icon: 'heroicons:eye',
    },
    {
      value: 'delete',
      label: 'Delete',
      icon: 'heroicons:trash',
    },
  ]

  return {
    linkedEvent,
    formattedEventDate,
    formattedNoteDate,
    cardItemActions,
  }
}
