import type { UserPreferences } from "@features/settings/types";

export const useSettingsStore = defineStore('settings', () => {
  const loading = ref(false)
  const preferences = ref<UserPreferences | null>(null)

  const setLoading = (value: boolean) => {
    loading.value = value
  }
  const setUserPreferences = (value: UserPreferences | null) => {
    preferences.value = value
  }

  return {
    preferences,
    setUserPreferences,
    loading,
    setLoading,
  }
})
