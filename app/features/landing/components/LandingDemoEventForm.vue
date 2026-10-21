<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DEMO_DAYS, DEMO_END_HOUR, DEMO_START_HOUR, validateEventDraft } from '../demo-data'

export interface DemoEventDraft {
  title: string
  day: number
  start: number
  end: number
}

const props = defineProps<{ draft: DemoEventDraft; editing: boolean; confirmDelete?: boolean }>()
const emit = defineEmits<{ save: [draft: DemoEventDraft]; cancel: []; delete: [] }>()

const title = ref(props.draft.title)
const day = ref(props.draft.day)
const start = ref(props.draft.start)
const end = ref(props.draft.end)
const touched = ref(false)
const confirming = ref(props.confirmDelete ?? false)

// the tour types the title from outside
watch(() => props.draft.title, (value) => (title.value = value))

const times = Array.from({ length: (DEMO_END_HOUR - DEMO_START_HOUR) * 2 + 1 }, (_, index) => {
  const hour = DEMO_START_HOUR + index / 2
  const whole = Math.floor(hour)
  const minutes = hour % 1 === 0 ? '00' : '30'
  return { value: hour, label: `${whole > 12 ? whole - 12 : whole}:${minutes} ${whole >= 12 ? 'pm' : 'am'}` }
})

const error = computed(() => validateEventDraft({ title: title.value, day: day.value, start: start.value, end: end.value }))
const shownError = computed(() => (error.value === 'Add a title' && !touched.value ? null : error.value))

function save() {
  if (error.value) return
  emit('save', { title: title.value.trim(), day: day.value, start: start.value, end: end.value })
}
</script>

<template>
  <form data-event-form class="flex w-[min(380px,92%)] flex-col gap-3 rounded-xl border border-border bg-white p-4 text-xs shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]" @submit.prevent="save" @keydown.esc="emit('cancel')">
    <b class="text-[13px] font-semibold">{{ editing ? 'Edit event' : 'New event' }}</b>
    <div>
      <label for="demo-event-title" class="mb-1.5 block font-medium">Title</label>
      <input id="demo-event-title" v-model="title" placeholder="Event title" autocomplete="off" class="w-full rounded-md border border-border bg-transparent px-[9px] py-1.5 text-xs shadow-xs outline-none focus:ring-1 focus:ring-zinc-400" @input="touched = true">
    </div>
    <div class="grid grid-cols-3 gap-2">
      <div>
        <label for="demo-event-day" class="mb-1.5 block font-medium">Day</label>
        <select id="demo-event-day" v-model.number="day" class="w-full rounded-md border border-border bg-white px-1.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400">
          <option v-for="(name, index) in DEMO_DAYS" :key="name" :value="index">{{ name }}</option>
        </select>
      </div>
      <div>
        <label for="demo-event-start" class="mb-1.5 block font-medium">Start</label>
        <select id="demo-event-start" v-model.number="start" class="w-full rounded-md border border-border bg-white px-1.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400">
          <option v-for="time in times" :key="time.value" :value="time.value">{{ time.label }}</option>
        </select>
      </div>
      <div>
        <label for="demo-event-end" class="mb-1.5 block font-medium">End</label>
        <select id="demo-event-end" v-model.number="end" class="w-full rounded-md border border-border bg-white px-1.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400">
          <option v-for="time in times" :key="time.value" :value="time.value">{{ time.label }}</option>
        </select>
      </div>
    </div>
    <p v-if="shownError" data-form-error class="text-[11px] text-[rgb(243,18,96)]">{{ shownError }}</p>
    <div v-if="confirming" class="flex items-center gap-2 border-t border-border pt-3">
      <span class="font-medium">Delete this event?</span>
      <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md bg-[rgb(243,18,96)] px-3 text-xs font-medium text-white" @click="emit('delete')">Yes</button>
      <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md px-3 text-xs font-medium hover:bg-zinc-100" @click="confirming = false">No</button>
    </div>
    <div v-else class="flex items-center gap-1.5">
      <button type="submit" class="inline-flex h-7 cursor-pointer items-center rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/80 disabled:cursor-default disabled:opacity-45" :disabled="error !== null">Save</button>
      <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md px-3 text-xs font-medium hover:bg-zinc-100" @click="emit('cancel')">Cancel</button>
      <button v-if="editing" type="button" class="ml-auto inline-flex h-7 cursor-pointer items-center rounded-md px-3 text-xs font-medium text-[rgb(243,18,96)] hover:bg-zinc-100" @click="confirming = true">Delete</button>
    </div>
  </form>
</template>
