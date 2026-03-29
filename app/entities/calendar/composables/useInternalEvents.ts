import { useNotification } from '@features/notification'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useUserStore } from '@features/auth/stores/user'
import type { CalendarEvent } from '@features/integrations/google-calendar'

export const useInternalEvents = () => {
  const supabase = useSupabaseClient()
  const userStore = useUserStore()
  const { showErrorToast, showSuccessToast } = useNotification()
  const googleCalendarStore = useGoogleCalendarStore()

  const getUserId = () => {
    const id = userStore.user?.id
    if (!id) throw new Error('No authenticated user')
    return id
  }

  const loadEvents = async (range?: { start: string; end: string }) => {
    const userId = getUserId()

    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_internal', true)
      .order('start_at', { ascending: true })

    if (range) {
      query = query.gte('start_at', range.start).lte('end_at', range.end)
    }

    const { data, error } = await query

    if (error) {
      showErrorToast({ title: 'Error', description: error.message })
      return
    }

    // Store internal events keyed by user ID (same pattern as google events keyed by account ID)
    googleCalendarStore.setCalendarEvents(`internal_${userId}`, data ?? [])
  }

  const createEvent = async (payload: {
    title: string | null
    description: string | null
    location: string | null
    start_at: string
    end_at: string
    all_day: boolean
  }) => {
    const userId = getUserId()

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        title: payload.title,
        description: payload.description,
        location: payload.location,
        start_at: payload.start_at,
        end_at: payload.end_at,
        all_day: payload.all_day,
        is_internal: true,
      })
      .select()
      .single()

    if (error) {
      showErrorToast({ title: 'Error', description: error.message })
      return null
    }

    showSuccessToast({ title: 'Event created' })
    return data
  }

  const updateEvent = async (id: string, payload: Partial<CalendarEvent>) => {
    const userId = getUserId()

    const { data, error } = await supabase
      .from('calendar_events')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_internal', true)
      .select()
      .single()

    if (error) {
      showErrorToast({ title: 'Error', description: error.message })
      return null
    }

    showSuccessToast({ title: 'Event updated' })
    return data
  }

  const deleteEvent = async (id: string) => {
    const userId = getUserId()

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_internal', true)

    if (error) {
      showErrorToast({ title: 'Error', description: error.message })
      return false
    }

    showSuccessToast({ title: 'Event deleted' })
    return true
  }

  return {
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
