import { storeToRefs } from 'pinia'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useDb } from '@shared/api/supabase'
import type { AppNotification } from '@shared/types/notification'
import { useNotificationsStore } from '../stores/notifications'
import { API } from '@shared/constants/api'

let channel: RealtimeChannel | null = null
let subscribedUserId: string | null = null

export const useUnreadNotifications = () => {
  const supabase = useDb()
  const store = useNotificationsStore()
  const { unreadCount, latest } = storeToRefs(store)

  const refreshUnreadCount = async (userId: string) => {
    const { count, error } = await supabase
      .from(API.TABLES.NOTIFICATIONS)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)

    if (!error) store.setUnreadCount(count ?? 0)
  }

  const stop = async () => {
    if (channel) await supabase.removeChannel(channel)
    channel = null
    subscribedUserId = null
  }

  const start = async (userId: string) => {
    if (subscribedUserId === userId) return
    await stop()
    subscribedUserId = userId

    channel = supabase
      .channel(API.CHANNELS.NOTIFICATIONS(userId))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: API.TABLES.NOTIFICATIONS, filter: `user_id=eq.${userId}` },
        (payload) => store.receive(payload.new as AppNotification),
      )
      .subscribe()

    await refreshUnreadCount(userId)
  }

  const markAllAsRead = async (userId: string) => {
    if (unreadCount.value === 0) return

    const { error } = await supabase
      .from(API.TABLES.NOTIFICATIONS)
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    if (!error) store.setUnreadCount(0)
  }

  return { unreadCount, latest, start, stop, refreshUnreadCount, markAllAsRead }
}
