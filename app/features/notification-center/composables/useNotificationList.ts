import { useDb } from '@shared/api/supabase'
import { useToast } from '@shared/lib/toast'
import { useUserStore } from '@entities/user'
import { NOTIFICATIONS_PAGE_SIZE, useNotificationListStore } from '../stores/notification-list'
import { notificationsResponseSchema } from '../schemas/notification'
import { API } from '@shared/constants/api'

const sanitizeSearchTerm = (raw: string) =>
  raw.replace(/[,()*%]/g, ' ').replace(/\s+/g, ' ').trim()

export const useNotificationList = () => {
  const notificationListStore = useNotificationListStore()
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)

  const supabase = useDb()

  const userId = computed(() => user.value?.id)

  const fetchNotifications = async ({ reset = false }: { reset?: boolean } = {}) => {
    if (!userId.value) {
      useToast().showErrorToast({ title: 'Error', description: 'User not logged in' })
      return
    }
    if (notificationListStore.loading) return
    if (!reset && !notificationListStore.hasMore && notificationListStore.notifications.length > 0) return

    if (reset) notificationListStore.resetList()

    notificationListStore.setLoading(true)

    const page = notificationListStore.page
    const from = page * NOTIFICATIONS_PAGE_SIZE
    const to = from + NOTIFICATIONS_PAGE_SIZE - 1

    let query = supabase
      .from(API.TABLES.NOTIFICATIONS)
      .select('*', { count: 'exact' })
      .eq('user_id', userId.value)

    const term = sanitizeSearchTerm(notificationListStore.search)
    if (term) {
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,author_name.ilike.%${term}%,author_email.ilike.%${term}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    notificationListStore.setLoading(false)

    if (error) {
      useToast().showErrorToast({ title: 'Error', description: error.message })
      return
    }

    const parsed = notificationsResponseSchema.safeParse(data ?? [])

    if (!parsed.success) {
      useToast().showErrorToast({ title: 'Error', description: 'Invalid notifications response' })
      return
    }

    if (page === 0) {
      notificationListStore.setNotifications(parsed.data)
    } else {
      notificationListStore.appendNotifications(parsed.data)
    }
    notificationListStore.setTotal(count ?? parsed.data.length)
    notificationListStore.setPage(page + 1)
  }

  const loadMoreNotifications = async () => {
    if (notificationListStore.loading || !notificationListStore.hasMore) return
    await fetchNotifications()
  }

  const refreshNotifications = async () => {
    await fetchNotifications({ reset: true })
  }

  return {
    fetchNotifications,
    loadMoreNotifications,
    refreshNotifications,
  }
}
