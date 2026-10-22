<script lang="ts" setup>
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useSettingsStore } from '@features/settings'
import { useCalendarFiltersStore } from '@entities/calendar/stores/calendar-filters'
import { ACCOUNT_COLORS, INTERNAL_CALENDAR_COLOR } from '@entities/calendar/stores/calendar'
import { INTERNAL_SOURCE_ID, sourceIdOf } from '@entities/calendar/helpers/filters'

const googleCalendarStore = useGoogleCalendarStore()
const settingsStore = useSettingsStore()
const filtersStore = useCalendarFiltersStore()
const { accounts, allEvents } = storeToRefs(googleCalendarStore)
const { hiddenSources } = storeToRefs(filtersStore)

const openGroups = reactive({ google: true, planify: true })

// Counts include hidden sources, so a hidden row still shows how many events it has.
const counts = computed(() => {
  const result: Record<string, number> = {}
  for (const event of allEvents.value) {
    const id = sourceIdOf(event)
    result[id] = (result[id] ?? 0) + 1
  }
  return result
})

const googleRows = computed(() =>
  accounts.value.map((account, index) => {
    const color = settingsStore.preferences?.eventsColors[account.id] ?? ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
    return {
      id: account.id,
      name: account.display_name || account.email,
      color: color?.lightColors.main ?? INTERNAL_CALENDAR_COLOR.lightColors.main,
    }
  })
)

const planifyRows = computed(() => [
  {
    id: INTERNAL_SOURCE_ID,
    name: 'Planify',
    color: (settingsStore.preferences?.eventsColors[INTERNAL_SOURCE_ID] ?? INTERNAL_CALENDAR_COLOR).lightColors.main,
  },
])

const groups = computed(() => [
  { key: 'google' as const, name: 'Google accounts', rows: googleRows.value },
  { key: 'planify' as const, name: 'Planify', rows: planifyRows.value },
])

const isHidden = (id: string) => hiddenSources.value.includes(id)
const allHidden = (rows: { id: string }[]) => rows.length > 0 && rows.every((row) => isHidden(row.id))

const toggleGroup = (rows: { id: string }[]) => {
  filtersStore.setGroupVisible(rows.map((row) => row.id), allHidden(rows))
}
</script>

<template>
  <div class="flex flex-col gap-1 px-2 pb-2" data-testid="supa-sidebar-calendars">
    <p class="text-sidebar-foreground/70 font-medium text-xs leading-[16px] h-8 pt-3 pl-2 whitespace-nowrap">
      Calendars
    </p>

    <template v-for="group in groups" :key="group.key">
      <div v-if="group.rows.length" class="flex flex-col">
        <div class="flex items-center gap-1 text-sidebar-foreground/70 text-xs h-7">
          <button
            type="button"
            class="flex items-center gap-2 flex-1 min-w-0 h-full pl-2 cursor-pointer hover:text-sidebar-foreground"
            :aria-expanded="openGroups[group.key]"
            @click="openGroups[group.key] = !openGroups[group.key]"
          >
            <SupaIcon
              name="lucide:chevron-down"
              :ui="{ icon: `size-4 shrink-0 transition-transform ${openGroups[group.key] ? '' : '-rotate-90'}` }"
            />
            <span class="truncate whitespace-nowrap">{{ group.name }}</span>
          </button>
          <button
            type="button"
            class="shrink-0 p-1 mr-1 cursor-pointer hover:text-sidebar-foreground"
            :aria-label="allHidden(group.rows) ? `Show all ${group.name}` : `Hide all ${group.name}`"
            :data-testid="`calendar-group-toggle-${group.key}`"
            @click="toggleGroup(group.rows)"
          >
            <SupaIcon :name="allHidden(group.rows) ? 'lucide:eye-off' : 'lucide:eye'" :ui="{ icon: 'size-4' }" />
          </button>
        </div>

        <template v-if="openGroups[group.key]">
          <button
            v-for="row in group.rows"
            :key="row.id"
            type="button"
            class="flex items-center gap-3 h-8 pl-3 pr-2 rounded-md text-sm cursor-pointer hover:bg-white/5"
            :class="isHidden(row.id) ? 'text-sidebar-foreground/40' : 'text-sidebar-foreground'"
            :aria-pressed="!isHidden(row.id)"
            :data-testid="`calendar-source-${row.id}`"
            @click="filtersStore.toggleSource(row.id)"
          >
            <span
              class="size-3 rounded-full shrink-0 border-2"
              :style="{
                borderColor: row.color,
                backgroundColor: isHidden(row.id) ? 'transparent' : row.color,
              }"
            />
            <span class="truncate whitespace-nowrap flex-1 text-left">{{ row.name }}</span>
            <span class="text-xs tabular-nums shrink-0" data-testid="calendar-source-count">
              {{ counts[row.id] ?? 0 }}
            </span>
          </button>
        </template>
      </div>
    </template>
  </div>
</template>
