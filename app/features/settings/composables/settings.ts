import { useSettingsStore } from "@features/settings/stores/settings";
import type { EventColorConfig, EventsColorsMap, UserPreferences } from "@features/settings/types";
import { PRESET_COLORS, INTERNAL_CALENDAR_COLOR } from '../constants/default-accounts-colors'
import { userPreferencesSchema } from "@features/settings/schemas/preferences";
import { defaultPreferences } from "@features/settings/constants/preferences";
import { useNotification } from "@features/notification";

export const useSettings = () => {
  const settingsStore = useSettingsStore()
  const supabase = useSupabaseClient()

  const getUserPreferences = async (userId: string) => {
    settingsStore.setLoading(true)

    const { data, error } = await supabase
      .from('settings')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle()

    settingsStore.setLoading(true)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
    }

    if (!data) {
      void setUserPreferences(userId, defaultPreferences)
      return
    }

    const parsed = userPreferencesSchema.safeParse(data?.preferences)

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid preferences' })
      return defaultPreferences
    }

    settingsStore.setUserPreferences(parsed.data)
  }

  const setUserPreferences = async (userId: string, preferences: UserPreferences) => {
    const parsed = userPreferencesSchema.parse(preferences)
    settingsStore.setLoading(true)

    const { error } = await supabase
      .from('settings')
      .upsert({
        user_id: userId,
        preferences: parsed,
        updated_at: new Date().toISOString(),
      })

    settingsStore.setLoading(true)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
    }
  }

  const setEventColor = (
    preferences: UserPreferences,
    sourceKey: string,
    config: EventColorConfig
  ) => {
    settingsStore.setUserPreferences({
      ...preferences,
      eventsColors: {
        ...preferences?.eventsColors,
        [sourceKey]: config,
      },
    })
  }

  return {
    getUserPreferences,
    setUserPreferences,
    setEventColor,
  }
}
