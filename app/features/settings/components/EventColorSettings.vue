<script setup lang="ts">
import { useEventColorSettings } from '@features/settings/composables/useEventColorSettings'

const {
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
} = useEventColorSettings()

// FIXME: change to emits
defineExpose({ isDirty, isSaving, save, discard })
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <div class="grid grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="space-y-3">
          <SupaSkeleton class="h-4 w-3/4 rounded" />
          <SupaSkeleton class="h-8 w-full rounded-md" />
          <SupaSkeleton class="h-7 w-24 rounded-full" />
          <SupaSkeleton class="h-20 w-full rounded-md" />
        </div>
      </div>
    </template>

    <template v-else>
      <!-- Form grid -->
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="(source, index) in sources"
          :key="source.key"
          class="space-y-3"
        >
          <p
            v-if="source.label"
            class="text-sm font-medium truncate min-h-9"
          >
            {{ source.label }}
          <p
            v-if="source.email"
            class="text-xs truncate text-placeholder"
          >
            {{ source.email }}
          </p>
          </p>

          <input
            v-if="draft[source.key]"
            v-model="draft[source.key].colorName"
            type="text"
            placeholder="Event label..."
            class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />

          <!-- Preset swatches -->
          <div class="flex gap-2 items-center">
            <button
              v-for="preset in PRESET_COLORS"
              :key="preset.colorName"
              type="button"
              class="size-7 rounded-full border-2 transition-all hover:scale-110"
              :style="{ backgroundColor: preset.lightColors.main }"
              :class="
                draft[source.key] && isPresetSelected(source.key, preset)
                  ? 'border-foreground scale-110'
                  : 'border-transparent'
              "
              :title="preset.colorName"
              @click="selectPreset(source.key, preset)"
            />
          </div>

          <!-- Three independent color pickers -->
          <div v-if="draft[source.key]" class="space-y-2">
            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="rgbStringToHex(draft[source.key].lightColors.main)"
                class="size-7 cursor-pointer rounded border border-border bg-transparent p-0.5 shrink-0"
                @input="onMainChange(source.key, ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-muted-foreground">Foreground</span>
            </div>

            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="rgbStringToHex(draft[source.key].lightColors.container)"
                class="size-7 cursor-pointer rounded border border-border bg-transparent p-0.5 shrink-0"
                @input="onContainerChange(source.key, ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-muted-foreground">Background</span>
            </div>

            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="rgbStringToHex(draft[source.key].lightColors.onContainer)"
                class="size-7 cursor-pointer rounded border border-border bg-transparent p-0.5 shrink-0"
                @input="onOnContainerChange(source.key, ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-muted-foreground">On background</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar preview -->
      <div class="border border-border rounded-md overflow-hidden">
        <p class="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30">
          Preview
        </p>

        <div class="grid grid-cols-5 border-b border-border">
          <div
            v-for="day in WEEK_DAYS"
            :key="day"
            class="py-2 text-center text-xs text-muted-foreground font-medium border-r border-border last:border-r-0"
          >
            {{ day }}
          </div>
        </div>

        <div class="grid grid-cols-5 min-h-[96px] p-1 gap-1">
          <div
            v-for="(day, dayIndex) in WEEK_DAYS"
            :key="day"
            class="flex flex-col gap-1 border-r border-border/50 last:border-r-0 px-1"
          >
            <div
              v-for="source in previewEventsForDay(dayIndex)"
              :key="source.key"
              class="text-xs px-2 py-1 rounded-sm truncate border-l-2 leading-5"
              :style="{
                backgroundColor: draft[source.key]?.lightColors.container,
                borderLeftColor: draft[source.key]?.lightColors.main,
                color: draft[source.key]?.lightColors.onContainer,
              }"
            >
              {{ draft[source.key]?.colorName || 'Event' }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
