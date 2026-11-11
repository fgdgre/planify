<script setup lang="ts">
import { toNotificationToast, useNotificationList, useNotificationListStore } from '@features/notification-center'
import { useUnreadNotifications } from '@entities/notification'
import { useUserStore } from '@entities/user'

definePageMeta({
  layout: 'app',
  title: 'Notifications',
})

const notificationListStore = useNotificationListStore()
const { notifications, search, hasActiveSearch, hasMore, loading, total } = storeToRefs(notificationListStore)
const { refreshNotifications, loadMoreNotifications } = useNotificationList()
const { latest, markAllAsRead } = useUnreadNotifications()
const { user } = storeToRefs(useUserStore())

const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer')

useInfiniteScroll(
  scrollContainer,
  () => loadMoreNotifications(),
  {
    distance: 200,
    canLoadMore: () => hasMore.value && !loading.value,
  }
)

const markSeen = () => {
  if (user.value) markAllAsRead(user.value.id)
}

await refreshNotifications()
markSeen()

watch(latest, (notification) => {
  if (!notification) return
  notificationListStore.addNotification(notification)
  markSeen()
})

const searchInput = ref(search.value)
const debouncedRefresh = useDebounceFn(() => refreshNotifications(), 350)

watch(searchInput, (val) => {
  notificationListStore.setSearch(val)
  debouncedRefresh()
})

const toasts = computed(() => notifications.value.map(toNotificationToast))

const showInitialSkeleton = computed(() => loading.value && notifications.value.length === 0)
const showEmptyState = computed(() => !loading.value && notifications.value.length === 0)
</script>

<template>
  <div ref="scrollContainer" class="flex flex-col flex-1 overflow-auto">
    <div class="flex flex-col flex-1 p-4 gap-4 w-full max-w-[720px]">
      <SupaInput
        v-model="searchInput"
        placeholder="Search notifications..."
        leading-icon="lucide:search"
        :ui="{ wrapper: 'w-fit' }"
      />

      <div v-if="total > 0" class="text-xs text-placeholder">
        Showing {{ notifications.length }} of {{ total }}
      </div>

      <SupaToastsGroup v-if="!showEmptyState" :toasts static-position />

      <div v-if="showInitialSkeleton" class="flex flex-col gap-[10px]">
        <SupaSkeleton
          v-for="n in 4"
          :key="`skeleton-${n}`"
          class="h-[96px] rounded-lg"
        />
      </div>

      <div
        v-if="showEmptyState"
        class="flex flex-1 items-center justify-center rounded-md border border-dashed border-border p-10 text-center text-sm text-placeholder"
      >
        <p v-if="hasActiveSearch">
          No notifications match your search.
        </p>
        <p v-else>
          No notifications yet. Events added to your connected calendars will show up here.
        </p>
      </div>

      <div v-if="hasMore && loading" class="flex items-center justify-center py-4">
        <SupaSpinner />
      </div>
    </div>
  </div>
</template>
