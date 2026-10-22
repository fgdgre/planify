<script lang="ts" setup>
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useSettingsStore } from '@features/settings'
import { useCalendarFiltersStore } from '@entities/calendar/stores/calendar-filters'
import { ACCOUNT_COLORS, INTERNAL_CALENDAR_COLOR } from '@entities/calendar/stores/calendar'
import { INTERNAL_SOURCE_ID, sourceIdOf } from '@entities/calendar/helpers/filters'

defineProps<{ collapsed?: boolean }>()

const googleCalendarStore = useGoogleCalendarStore()
const settingsStore = useSettingsStore()
const filtersStore = useCalendarFiltersStore()
const { accounts, allEvents } = storeToRefs(googleCalendarStore)
const { hiddenSources } = storeToRefs(filtersStore)

const googleOpen = ref(true)

// Counts include hidden sources, so a hidden row still shows how many events it has.
const counts = computed(() => {
  const result: Record<string, number> = {}
  for (const event of allEvents.value) {
    const id = sourceIdOf(event)
    result[id] = (result[id] ?? 0) + 1
  }
  return result
})

// Event blocks paint the semi-transparent `container` color on a white grid.
// The sidebar is dark, so blend it on white first to get the same light tint as the events.
const onWhite = (color: string) => {
  const match = color.match(/rgba?\(([^)]+)\)/)
  if (!match) return color
  const [r, g, b, a = 1] = match[1]!.split(',').map((part) => Number(part.trim()))
  const blend = (channel: number) => Math.round(channel * a + 255 * (1 - a))
  return `rgb(${blend(r!)}, ${blend(g!)}, ${blend(b!)})`
}

const googleRows = computed(() =>
  accounts.value.map((account, index) => {
    const color = settingsStore.preferences?.eventsColors[account.id] ?? ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
    return {
      id: account.id,
      name: account.email,
      tooltip: account.display_name || account.email,
      color: onWhite(color?.lightColors.container ?? INTERNAL_CALENDAR_COLOR.lightColors.container),
    }
  })
)

const planifyRows = computed(() => [
  {
    id: INTERNAL_SOURCE_ID,
    name: 'Planify',
    tooltip: 'Planify',
    color: onWhite((settingsStore.preferences?.eventsColors[INTERNAL_SOURCE_ID] ?? INTERNAL_CALENDAR_COLOR).lightColors.container),
  },
])

const isHidden = (id: string) => hiddenSources.value.includes(id)
const allHidden = (rows: { id: string }[]) => rows.length > 0 && rows.every((row) => isHidden(row.id))

const toggleGroup = (rows: { id: string }[]) => {
  filtersStore.setGroupVisible(rows.map((row) => row.id), allHidden(rows))
}
</script>

<template>
  <div class="flex flex-col gap-1 px-2 pb-2 mt-2" data-testid="supa-sidebar-calendars">
    <p
      v-if="!collapsed"
      class="text-sidebar-foreground/70 font-medium text-xs leading-[16px] h-8 pt-3 pl-2 truncate"
    >
      Calendars
    </p>

    <div v-if="googleRows.length" class="flex flex-col">
      <div v-if="!collapsed" class="flex items-center text-sidebar-foreground/70 text-xs h-7">
        <button
          type="button"
          class="flex items-center gap-2 flex-1 min-w-0 h-full pl-2 cursor-pointer hover:text-sidebar-foreground"
          :aria-expanded="googleOpen"
          @click="googleOpen = !googleOpen"
        >
          <SupaIcon
            name="lucide:chevron-down"
            :ui="{ icon: `size-4 shrink-0 transition-transform ${googleOpen ? '' : '-rotate-90'}` }"
          />
          <span class="truncate min-w-0">Google accounts</span>
        </button>
        <button
          type="button"
          class="w-8 h-full shrink-0 flex items-center justify-center cursor-pointer hover:text-sidebar-foreground"
          :aria-label="allHidden(googleRows) ? 'Show all Google accounts' : 'Hide all Google accounts'"
          data-testid="calendar-group-toggle-google"
          @click="toggleGroup(googleRows)"
        >
          <SupaIcon :name="allHidden(googleRows) ? 'lucide:eye-off' : 'lucide:eye'" :ui="{ icon: 'size-4' }" />
        </button>
      </div>

      <template v-if="googleOpen || collapsed">
        <button
          v-for="row in googleRows"
          :key="row.id"
          type="button"
          class="flex items-center gap-3 h-8 pl-3 pr-2 rounded-md text-sm cursor-pointer hover:bg-white/5"
          :class="isHidden(row.id) ? 'text-sidebar-foreground/40' : 'text-sidebar-foreground'"
          :aria-pressed="!isHidden(row.id)"
          :title="row.tooltip"
          :data-testid="`calendar-source-${row.id}`"
          @click="filtersStore.toggleSource(row.id)"
        >
          <span
            class="size-3 rounded-full shrink-0 border-2"
            :style="{ borderColor: row.color, backgroundColor: isHidden(row.id) ? 'transparent' : row.color }"
          />
          <template v-if="!collapsed">
            <span class="truncate min-w-0 flex-1 text-left">{{ row.name }}</span>
            <span class="text-xs tabular-nums shrink-0" data-testid="calendar-source-count">
              {{ counts[row.id] ?? 0 }}
            </span>
          </template>
        </button>
      </template>
    </div>

    <button
      v-for="row in planifyRows"
      :key="row.id"
      type="button"
      class="flex items-center gap-3 h-8 pl-3 pr-2 rounded-md text-sm cursor-pointer hover:bg-white/5"
      :class="isHidden(row.id) ? 'text-sidebar-foreground/40' : 'text-sidebar-foreground'"
      :aria-pressed="!isHidden(row.id)"
      :title="row.tooltip"
      :data-testid="`calendar-source-${row.id}`"
      @click="filtersStore.toggleSource(row.id)"
    >
      <span
        class="size-3 rounded-full shrink-0 border-2"
        :style="{ borderColor: row.color, backgroundColor: isHidden(row.id) ? 'transparent' : row.color }"
      />
      <template v-if="!collapsed">
        <span class="truncate min-w-0 flex-1 text-left">{{ row.name }}</span>
        <span class="text-xs tabular-nums shrink-0" data-testid="calendar-source-count">
          {{ counts[row.id] ?? 0 }}
        </span>
      </template>
    </button>
  </div>
</template>
