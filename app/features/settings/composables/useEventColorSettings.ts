import { useSettingsStore } from '@features/settings/stores/settings'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useUserStore } from '@features/auth/stores/user'
import { useSettings } from '@features/settings/composables/settings'
import { PRESET_COLORS, INTERNAL_CALENDAR_COLOR } from '@features/settings/constants/default-accounts-colors'
import type { EventColorConfig } from '@features/settings/types'

export const useEventColorSettings = () => {
  const settingsStore = useSettingsStore()
  const googleCalendarStore = useGoogleCalendarStore()
  const userStore = useUserStore()
  const { setUserPreferences } = useSettings()

  const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

  const sources = computed(() => [
    { key: 'internal', label: 'Personal Events' },
    ...googleCalendarStore.accounts.map((account) => ({
      key: account.id,
      label: account.display_name,
      email: account.email
    })),
  ])

  const draft = ref<Record<string, EventColorConfig>>({})
  const originalSnapshot = ref('')

  const defaultForKey = (key: string, index: number): EventColorConfig => {
    const source = key === 'internal' ? INTERNAL_CALENDAR_COLOR : PRESET_COLORS[index % PRESET_COLORS.length]
    return { ...source, lightColors: { ...source.lightColors } }
  }

  const initDraft = () => {
    const prefs = settingsStore.preferences
    const newDraft: Record<string, EventColorConfig> = {}
    sources.value.forEach((source, index) => {
      const existing = prefs?.eventsColors[source.key]
      newDraft[source.key] = existing
        ? { ...existing, lightColors: { ...existing.lightColors } }
        : defaultForKey(source.key, index)
    })
    draft.value = newDraft
    originalSnapshot.value = JSON.stringify(newDraft)
  }

  watch(
    [() => settingsStore.preferences, () => googleCalendarStore.accounts],
    initDraft,
    { immediate: true }
  )

  const isDirty = computed(() => JSON.stringify(draft.value) !== originalSnapshot.value)
  const isLoading = computed(() => settingsStore.loading && !settingsStore.preferences)

  // ---- Color utilities ----

  function hexToRgb(hex: string): [number, number, number] {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
  }

  function rgbStringToHex(rgbStr: string): string {
    const match = rgbStr.match(/\d+/g)
    if (!match || match.length < 3) return '#808080'
    return '#' + match.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')
  }

  function isPresetSelected(key: string, preset: (typeof PRESET_COLORS)[number]): boolean {
    return draft.value[key]?.lightColors.main === preset.lightColors.main
  }

  function selectPreset(key: string, preset: (typeof PRESET_COLORS)[number]) {
    if (!draft.value[key]) return
    draft.value[key] = { colorName: draft.value[key].colorName, lightColors: { ...preset.lightColors } }
  }

  function onMainChange(key: string, hex: string) {
    if (!draft.value[key]) return
    const [r, g, b] = hexToRgb(hex)
    draft.value[key] = { ...draft.value[key], lightColors: { ...draft.value[key].lightColors, main: `rgb(${r}, ${g}, ${b})` } }
  }

  function onContainerChange(key: string, hex: string) {
    if (!draft.value[key]) return
    const [r, g, b] = hexToRgb(hex)
    draft.value[key] = { ...draft.value[key], lightColors: { ...draft.value[key].lightColors, container: `rgba(${r}, ${g}, ${b}, 0.2)` } }
  }

  function onOnContainerChange(key: string, hex: string) {
    if (!draft.value[key]) return
    const [r, g, b] = hexToRgb(hex)
    draft.value[key] = { ...draft.value[key], lightColors: { ...draft.value[key].lightColors, onContainer: `rgb(${r}, ${g}, ${b})` } }
  }

  // ---- Save / Discard ----

  const isSaving = ref(false)

  async function save() {
    if (!isDirty.value || !userStore.user) return
    isSaving.value = true
    const currentEventsColors = settingsStore.preferences?.eventsColors ?? {}
    await setUserPreferences(userStore.user.id, {
      eventsColors: { ...currentEventsColors, ...draft.value },
    })
    originalSnapshot.value = JSON.stringify(draft.value)
    isSaving.value = false
  }

  function discard() {
    initDraft()
  }

  // ---- Calendar preview ----

  function previewEventsForDay(dayIndex: number) {
    return sources.value
      .map((source, i) => ({ source, eventDayIndex: i % WEEK_DAYS.length }))
      .filter(({ eventDayIndex }) => eventDayIndex === dayIndex)
      .map(({ source }) => source)
  }

  return {
    WEEK_DAYS,
    PRESET_COLORS,
    sources,
    draft,
    isDirty,
    isLoading,
    isSaving,
    rgbStringToHex,
    isPresetSelected,
    selectPreset,
    onMainChange,
    onContainerChange,
    onOnContainerChange,
    save,
    discard,
    previewEventsForDay,
  }
}
