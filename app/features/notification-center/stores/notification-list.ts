import type { AppNotification } from '@shared/types/notification'

export const NOTIFICATIONS_PAGE_SIZE = 20

export const useNotificationListStore = defineStore('notification-list', () => {
  const notifications = ref<AppNotification[]>([])
  const loading = ref(false)
  const page = ref(0)
  const total = ref(0)
  const search = ref('')

  const hasMore = computed(() => notifications.value.length < total.value)

  const hasActiveSearch = computed(() => search.value.trim().length > 0)

  const setNotifications = (data: AppNotification[]) => {
    notifications.value = data
  }

  const appendNotifications = (data: AppNotification[]) => {
    notifications.value.push(...data)
  }

  const addNotification = (notification: AppNotification) => {
    if (notifications.value.some((n) => n.id === notification.id)) return
    notifications.value.unshift(notification)
    total.value += 1
  }

  const setLoading = (value: boolean) => {
    loading.value = value
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

  const resetList = () => {
    notifications.value = []
    page.value = 0
    total.value = 0
  }

  return {
    notifications,
    loading,
    page,
    total,
    search,
    hasMore,
    hasActiveSearch,
    setNotifications,
    appendNotifications,
    addNotification,
    setLoading,
    setPage,
    setTotal,
    setSearch,
    resetList,
  }
})
