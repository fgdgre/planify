import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppNotification } from '@shared/types/notification'

export const useNotificationsStore = defineStore('notifications', () => {
  const unreadCount = ref(0)
  const latest = ref<AppNotification | null>(null)

  const setUnreadCount = (count: number) => {
    unreadCount.value = Math.max(0, count)
  }

  const receive = (notification: AppNotification) => {
    latest.value = notification
    if (!notification.read_at) unreadCount.value++
  }

  const reset = () => {
    unreadCount.value = 0
    latest.value = null
  }

  return { unreadCount, latest, setUnreadCount, receive, reset }
})
