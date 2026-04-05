import { useSettingsStore } from "@features/settings/stores/settings";
import type { EventColorConfig, UserPreferences } from "@features/settings/types";
import { PRESET_COLORS, INTERNAL_CALENDAR_COLOR } from '../constants/default-accounts-colors'
import { userPreferencesSchema } from "@features/settings/schemas/preferences";
import { defaultPreferences } from "@features/settings/constants/preferences";
import { useNotification } from "@features/notification";
import type { GoogleAccount } from "@shared/types/google";

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

    settingsStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return
    }

    if (!data) {
      settingsStore.setUserPreferences(defaultPreferences)
      void setUserPreferences(userId, defaultPreferences)
      return
    }

    const parsed = userPreferencesSchema.safeParse(data?.preferences)

    if (!parsed.success) {
      useNotification().showErrorToast({ title: 'Error', description: 'Invalid preferences' })
      return
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

    settingsStore.setLoading(false)

    if (error) {
      useNotification().showErrorToast({ title: 'Error', description: error.message })
      return
    }

    useNotification().showSuccessToast({ title: 'Success', description: 'Preferences updated successfully' })
    settingsStore.setUserPreferences(parsed)
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

  /**
   * Ensures every Google account has a color in preferences.
   * Assigns PRESET_COLORS by account creation order for new accounts.
   */
  const syncAccountColors = async (userId: string, accounts: GoogleAccount[]) => {
    const current = settingsStore.preferences ?? { ...defaultPreferences }
    const updatedColors = { ...current.eventsColors }

    // Ensure internal is always set
    if (!updatedColors['internal']) {
      updatedColors['internal'] = INTERNAL_CALENDAR_COLOR
    }

    // Sort oldest first so color assignment is stable
    const sorted = [...accounts].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    let changed = false
    sorted.forEach((account, index) => {
      if (!updatedColors[account.id]) {
        updatedColors[account.id] = PRESET_COLORS[index % PRESET_COLORS.length]
        changed = true
      }
    })

    if (changed) {
      const updated: UserPreferences = { ...current, eventsColors: updatedColors }
      settingsStore.setUserPreferences(updated)
      await setUserPreferences(userId, updated)
    }
  }

  return {
    getUserPreferences,
    setUserPreferences,
    setEventColor,
    syncAccountColors,
  }
}
