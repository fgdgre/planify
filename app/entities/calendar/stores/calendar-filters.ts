import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useUserStore } from '@features/auth/stores/user'
import { getSafeStorage } from '@shared/lib/safe-storage'

const storageKey = (userId: string) => `planify:calendar-filters:${userId}`

const readHiddenSources = (userId: string): string[] => {
  try {
    const saved = JSON.parse(getSafeStorage()?.getItem(storageKey(userId)) ?? '[]')
    return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export const useCalendarFiltersStore = defineStore('calendar-filters', () => {
  const userStore = useUserStore()

  const hiddenSources = ref<string[]>([])
  const searchQuery = ref('')

  const save = () => {
    const userId = userStore.user?.id
    if (!userId) return

    try {
      getSafeStorage()?.setItem(storageKey(userId), JSON.stringify(hiddenSources.value))
    } catch {
    }
  }

  const setSourceVisible = (id: string, visible: boolean) => {
    const rest = hiddenSources.value.filter((hidden) => hidden !== id)
    hiddenSources.value = visible ? rest : [...rest, id]
    save()
  }

  const toggleSource = (id: string) => {
    setSourceVisible(id, hiddenSources.value.includes(id))
  }

  const setGroupVisible = (ids: string[], visible: boolean) => {
    const rest = hiddenSources.value.filter((hidden) => !ids.includes(hidden))
    hiddenSources.value = visible ? rest : [...rest, ...ids]
    save()
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const clearSearch = () => {
    searchQuery.value = ''
  }

  const reset = () => {
    hiddenSources.value = []
    searchQuery.value = ''
  }

  watch(
    () => userStore.user?.id,
    (userId) => {
      hiddenSources.value = userId ? readHiddenSources(userId) : []
    },
    { immediate: true },
  )

  return {
    hiddenSources,
    searchQuery,
    toggleSource,
    setSourceVisible,
    setGroupVisible,
    setSearchQuery,
    clearSearch,
    reset,
  }
})
