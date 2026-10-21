<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useEventListener, usePreferredReducedMotion } from '@vueuse/core'
import {
  DEMO_DAYS,
  DEMO_END_HOUR,
  DEMO_START_HOUR,
  DEMO_TODAY,
  createDemoAccounts,
  createDemoEvents,
  formatHour,
  layoutDay,
  matchesQuery,
  nextEventId,
  snapStart,
  type DemoAccount,
  type DemoAccountId,
  type DemoEvent,
} from '../demo-data'
import LandingDemoDashboard from './LandingDemoDashboard.vue'
import LandingDemoEventForm, { type DemoEventDraft } from './LandingDemoEventForm.vue'

const props = defineProps<{ step: 1 | 2 | 3 | 4 | 5 | null }>()
const emit = defineEmits<{ takeControl: []; resume: [] }>()

const dates = [19, 20, 21, 22, 23]
const hourLabels = Array.from({ length: DEMO_END_HOUR - DEMO_START_HOUR }, (_, index) => {
  const hour = DEMO_START_HOUR + index
  return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`
})

const accountStyles: Record<DemoAccountId, { background: string; color: string }> = {
  acme: { background: '#fdeaea', color: '#b4232a' },
  studio: { background: '#e6f5ee', color: '#1d7a4d' },
  personal: { background: '#e8effe', color: '#2357c4' },
  planify: { background: '#eae7f7', color: '#6f5fb8' },
}

const reducedMotion = usePreferredReducedMotion()
const animated = computed(() => reducedMotion.value !== 'reduce')

const accounts = ref(createDemoAccounts())
const events = ref(createDemoEvents())
const visibleIds = ref<DemoAccountId[]>(accounts.value.map((account) => account.id))
const selectedId = ref<number | null>(null)
const query = ref('')
const view = ref<'calendar' | 'dashboard'>('calendar')
const mode = ref<'tour' | 'live'>('tour')

const form = ref<{ id: number | null; draft: DemoEventDraft; confirmDelete: boolean } | null>(null)

const editingNote = ref<number | null>(null)
const editNoteTitle = ref('')
const editNoteBody = ref('')
const deletingNote = ref<number | null>(null)

const noting = ref(false)
const noteTitle = ref('')
const noteBody = ref('')
const noteTitleInput = ref<HTMLInputElement | null>(null)

const root = ref<HTMLElement | null>(null)
const days = ref<HTMLElement | null>(null)
const rowHeight = ref(40)
const popIn = ref(false)
const tip = ref({ text: '', x: 0, y: 0, on: false })
const shakingId = ref<number | null>(null)

let tipTimer: ReturnType<typeof setTimeout> | undefined
let shakeTimer: ReturnType<typeof setTimeout> | undefined
let popTimer: ReturnType<typeof setTimeout> | undefined
let panelTimer: ReturnType<typeof setTimeout> | undefined
let typingTimer: ReturnType<typeof setInterval> | undefined

function findAccount(id: DemoAccountId): DemoAccount {
  return accounts.value.find((account) => account.id === id)!
}

const visibleEvents = computed(() => events.value.filter((event) => visibleIds.value.includes(event.account)))
const selectedEvent = computed(() => events.value.find((event) => event.id === selectedId.value))
const hits = computed(() => visibleEvents.value.filter((event) => matchesQuery(event, findAccount(event.account), query.value)))
const hasQuery = computed(() => query.value.trim() !== '')

const layouts = computed(() => {
  const placed = new Map<number, { column: number; columns: number }>()
  DEMO_DAYS.forEach((_, day) => {
    layoutDay(visibleEvents.value.filter((event) => event.day === day)).forEach((item) => placed.set(item.id, item))
  })
  return placed
})

function eventCount(id: DemoAccountId) {
  return events.value.filter((event) => event.account === id).length
}

function eventStyle(event: DemoEvent) {
  const place = layouts.value.get(event.id) ?? { column: 0, columns: 1 }
  const width = 20 / place.columns
  return {
    ...accountStyles[event.account],
    borderColor: findAccount(event.account).color,
    top: `${(event.start - DEMO_START_HOUR) * rowHeight.value + 1}px`,
    height: `${event.length * rowHeight.value - 3}px`,
    left: `calc(${event.day * 20 + place.column * width}% + 3px)`,
    width: `calc(${width}% - 6px)`,
    '--i': event.id,
  }
}

function toggleAccount(id: DemoAccountId) {
  visibleIds.value = visibleIds.value.includes(id) ? visibleIds.value.filter((item) => item !== id) : [...visibleIds.value, id]
}

function measureRows() {
  if (!days.value) return
  rowHeight.value = Math.max(30, Math.floor(days.value.clientHeight / (DEMO_END_HOUR - DEMO_START_HOUR)))
}

function showTip(text: string, el: HTMLElement) {
  const box = el.getBoundingClientRect()
  const rootBox = root.value?.getBoundingClientRect()
  tip.value = { text, x: box.left - (rootBox?.left ?? 0), y: box.top - (rootBox?.top ?? 0) - 30, on: true }
  clearTimeout(tipTimer)
  tipTimer = setTimeout(() => (tip.value.on = false), 1600)
}

function showTipForEvent(text: string, id: number) {
  const el = days.value?.querySelector<HTMLElement>(`[data-event="${id}"]`)
  if (el) showTip(text, el)
}

function setView(next: 'calendar' | 'dashboard') {
  tip.value.on = false
  view.value = next
  if (next === 'calendar') {
    closePanel()
    return
  }
}

function openPanel(id: number) {
  selectedId.value = id
  noting.value = false
  noteTitle.value = ''
  noteBody.value = ''
  cancelNoteEdit()
}

function closePanel() {
  selectedId.value = null
  noting.value = false
  cancelNoteEdit()
}

function startNote() {
  noting.value = true
  nextTick(() => setTimeout(() => noteTitleInput.value?.focus(), 260))
}

const canSaveNote = computed(() => noteTitle.value.trim() !== '' || noteBody.value.trim() !== '')

function saveNote() {
  if (!canSaveNote.value || !selectedEvent.value) return
  selectedEvent.value.notes.push({ title: noteTitle.value.trim() || 'Untitled', body: noteBody.value.trim() })
  noting.value = false
  noteTitle.value = ''
  noteBody.value = ''
}

function startNoteEdit(index: number) {
  const note = selectedEvent.value?.notes[index]
  if (!note) return
  editingNote.value = index
  editNoteTitle.value = note.title
  editNoteBody.value = note.body
  deletingNote.value = null
}

function cancelNoteEdit() {
  editingNote.value = null
  deletingNote.value = null
}

function saveNoteEdit() {
  const note = editingNote.value === null ? undefined : selectedEvent.value?.notes[editingNote.value]
  if (!note || (editNoteTitle.value.trim() === '' && editNoteBody.value.trim() === '')) return
  note.title = editNoteTitle.value.trim() || 'Untitled'
  note.body = editNoteBody.value.trim()
  editingNote.value = null
}

function deleteNote(index: number) {
  selectedEvent.value?.notes.splice(index, 1)
  deletingNote.value = null
}

function onPanelKeydown(event: KeyboardEvent) {
  if (noting.value && event.key === 'Enter' && (event.metaKey || event.ctrlKey)) saveNote()
}

function openForm(draft: DemoEventDraft, id: number | null = null, confirmDelete = false) {
  tip.value.on = false
  form.value = { id, draft: { ...draft }, confirmDelete }
}

function openNewForm() {
  openForm({ title: '', day: DEMO_TODAY, start: 10, end: 11 })
}

function openEditForm(confirmDelete = false) {
  const event = selectedEvent.value
  if (!event) return
  openForm({ title: event.title, day: event.day, start: event.start, end: event.start + event.length }, event.id, confirmDelete)
}

function onGridClick(click: MouseEvent) {
  if ((click.target as HTMLElement).closest('[data-event]') || !days.value) return
  const box = days.value.getBoundingClientRect()
  const day = Math.min(4, Math.max(0, Math.floor(((click.clientX - box.left) / (box.width || 1)) * DEMO_DAYS.length)))
  const rawHour = DEMO_START_HOUR + (click.clientY - box.top) / rowHeight.value
  const start = snapStart(Math.floor(rawHour * 2) / 2, 1)
  openForm({ title: '', day, start, end: start + 1 })
}

function saveForm(draft: DemoEventDraft) {
  const current = form.value
  if (!current) return
  const existing = current.id === null ? undefined : events.value.find((event) => event.id === current.id)
  if (existing) {
    existing.title = draft.title
    existing.day = draft.day
    existing.start = draft.start
    existing.length = draft.end - draft.start
  } else {
    const id = nextEventId(events.value)
    events.value.push({ id, title: draft.title, account: 'planify', day: draft.day, start: draft.start, length: draft.end - draft.start, notes: [] })
    if (!visibleIds.value.includes('planify')) visibleIds.value = [...visibleIds.value, 'planify']
  }
  form.value = null
}

function deleteFromForm() {
  const id = form.value?.id
  form.value = null
  events.value = events.value.filter((event) => event.id !== id)
  if (selectedId.value === id) closePanel()
}

function openFromDashboard(id: number) {
  setView('calendar')
  openPanel(id)
}

function openFirstHit() {
  const first = [...hits.value].sort((a, b) => a.day - b.day || a.start - b.start)[0]
  if (!first) return
  setView('calendar')
  openPanel(first.id)
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') openFirstHit()
  if (event.key === 'Escape') query.value = ''
}

const drag = ref<{ event: DemoEvent; el: HTMLElement; x: number; y: number; offsetY: number; moved: boolean; locked: boolean } | null>(null)
const dropDay = ref<number | null>(null)

function onEventDown(pointer: PointerEvent, event: DemoEvent) {
  if (!pointer.isPrimary || pointer.button !== 0) return
  const el = pointer.currentTarget as HTMLElement
  drag.value = { event, el, x: pointer.clientX, y: pointer.clientY, offsetY: pointer.clientY - el.getBoundingClientRect().top, moved: false, locked: false }
  el.setPointerCapture?.(pointer.pointerId)
}

function onPointerMove(pointer: PointerEvent) {
  const current = drag.value
  if (!current || !days.value) return
  if (!current.moved && Math.hypot(pointer.clientX - current.x, pointer.clientY - current.y) < 5) return
  const wasMoved = current.moved
  current.moved = true

  if (!findAccount(current.event.account).own) {
    if (wasMoved) return
    current.locked = true
    shakingId.value = current.event.id
    showTip('Synced from Google: move it there', current.el)
    clearTimeout(shakeTimer)
    shakeTimer = setTimeout(() => (shakingId.value = null), 400)
    return
  }

  const box = days.value.getBoundingClientRect()
  const day = Math.min(4, Math.max(0, Math.floor(((pointer.clientX - box.left) / box.width) * DEMO_DAYS.length)))
  const rawHour = DEMO_START_HOUR + (pointer.clientY - current.offsetY - box.top) / rowHeight.value
  current.event.day = day
  current.event.start = snapStart(rawHour, current.event.length)
  dropDay.value = day
}

function onPointerUp() {
  const current = drag.value
  if (!current) return
  drag.value = null
  dropDay.value = null
  if (!current.moved) {
    openPanel(current.event.id)
    return
  }
  if (!current.locked) showTipForEvent(`Moved to ${DEMO_DAYS[current.event.day]} ${formatHour(current.event.start)}`, current.event.id)
}

function stopTyping() {
  clearInterval(typingTimer)
  typingTimer = undefined
}

function clearTourTimers() {
  stopTyping()
  clearTimeout(panelTimer)
  clearTimeout(popTimer)
}

function takeControl(event: Event) {
  if (mode.value === 'live') return
  if ((event.target as HTMLElement).closest('[data-resume]')) return
  clearTourTimers()
  mode.value = 'live'
  emit('takeControl')
}

function resumeTour() {
  mode.value = 'tour'
  emit('resume')
}

function runCreateStep() {
  const draft = { title: 'Client call', day: 2, start: 14, end: 15 }
  const existing = events.value.find((event) => event.title === draft.title)
  if (existing) {
    panelTimer = setTimeout(() => showTipForEvent('Your own event', existing.id), 250)
    return
  }
  if (!animated.value) {
    openForm(draft)
    saveForm(draft)
    return
  }
  openForm({ ...draft, title: '' })
  let typed = 0
  typingTimer = setInterval(() => {
    typed += 1
    if (form.value) form.value.draft.title = draft.title.slice(0, typed)
    if (typed < draft.title.length) return
    stopTyping()
    panelTimer = setTimeout(() => saveForm(draft), 600)
  }, 120)
}

function applyStep(step: 1 | 2 | 3 | 4 | 5) {
  clearTourTimers()
  form.value = null
  query.value = ''
  visibleIds.value = accounts.value.map((account) => account.id)

  if (step === 5) {
    closePanel()
    setView('dashboard')
    return
  }
  setView('calendar')

  if (step === 1) {
    if (!animated.value) return
    popIn.value = false
    nextTick(() => {
      popIn.value = true
      popTimer = setTimeout(() => (popIn.value = false), 1400)
    })
  }
  if (step === 2) runCreateStep()
  if (step === 3) {
    if (!animated.value) return openPanel(1)
    panelTimer = setTimeout(() => openPanel(1), 250)
  }
  if (step === 4) {
    if (!animated.value) {
      query.value = 'acme'
      return
    }
    let typed = 0
    typingTimer = setInterval(() => {
      typed += 1
      query.value = 'acme'.slice(0, typed)
      if (typed >= 4) stopTyping()
    }, 170)
  }
}

watch([() => props.step, mode], () => {
  if (mode.value === 'tour' && props.step !== null) applyStep(props.step)
})

useEventListener('resize', measureRows)

onMounted(() => {
  measureRows()
  if (mode.value === 'tour' && props.step !== null) applyStep(props.step)
})

onBeforeUnmount(() => {
  clearTourTimers()
  clearTimeout(tipTimer)
  clearTimeout(shakeTimer)
})
</script>

<template>
  <div
    ref="root"
    :data-mode="mode"
    class="relative grid h-full grid-cols-[52px_1fr] grid-rows-[1fr_auto] overflow-hidden rounded-[18px] border border-border bg-white text-xs transition-shadow duration-400 tablet:grid-cols-[160px_1fr]"
    :class="mode === 'live' ? 'shadow-[0_0_0_2px_var(--primary),0_40px_100px_-40px_rgba(111,95,184,0.6)]' : 'shadow-[0_40px_100px_-40px_rgba(111,95,184,0.5)]'"
    @pointerdown.passive="takeControl"
    @keydown.passive="takeControl"
  >
    <aside class="row-span-2 flex flex-col gap-2 bg-zinc-900 px-1.5 py-4 text-zinc-300 tablet:px-3">
      <span class="flex items-center gap-2 text-[13px] font-semibold text-white"><i class="inline-block size-4 rounded-[5px] bg-primary" /><span class="max-tablet:hidden">Planify</span></span>
      <div class="mt-2.5 mb-1.5 flex flex-col gap-0.5">
        <button type="button" class="flex cursor-pointer items-center gap-2 rounded-[7px] px-2 py-1.5 text-left hover:bg-zinc-800 max-tablet:justify-center" :class="view === 'calendar' ? 'bg-zinc-800 text-white' : 'text-zinc-400'" @click="setView('calendar')">▦<span class="max-tablet:hidden">Calendar</span></button>
        <button type="button" class="flex cursor-pointer items-center gap-2 rounded-[7px] px-2 py-1.5 text-left hover:bg-zinc-800 max-tablet:justify-center" :class="view === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400'" @click="setView('dashboard')">▥<span class="max-tablet:hidden">Dashboard</span></button>
      </div>
      <span class="mt-1 text-[11px] text-zinc-500 max-tablet:hidden">Calendars</span>
      <div class="flex flex-col">
        <button
          v-for="account in accounts"
          :key="account.id"
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 rounded-[7px] px-2 py-1.5 text-left hover:bg-zinc-800 max-tablet:justify-center"
          :class="visibleIds.includes(account.id) ? 'text-zinc-200' : 'text-zinc-500'"
          @click="toggleAccount(account.id)"
        >
          <span class="size-2.5 shrink-0 rounded-[3px] border-2 transition-colors duration-200" :style="{ borderColor: account.color, background: visibleIds.includes(account.id) ? account.color : 'transparent' }" />
          <span class="truncate max-tablet:hidden">{{ account.name }}</span>
          <small class="ml-auto text-[10px] text-zinc-500 max-tablet:hidden">{{ eventCount(account.id) }}</small>
        </button>
      </div>
    </aside>

    <div class="flex min-h-0 min-w-0 flex-col">
      <div class="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <label class="flex flex-1 cursor-text items-center gap-2 rounded-[9px] border border-border px-2.5 py-[7px] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary-soft">
          🔍
          <input v-model="query" type="text" placeholder="Search events" autocomplete="off" class="min-w-0 flex-1 bg-transparent text-[13px] outline-none" @keydown="onSearchKeydown">
          <span v-if="hasQuery" class="text-[11px] whitespace-nowrap text-placeholder">{{ hits.length }} result{{ hits.length === 1 ? '' : 's' }}</span>
        </label>
        <span class="hidden text-xs font-medium whitespace-nowrap text-placeholder tablet:inline">Oct 19 – 23</span>
        <button type="button" class="inline-flex h-8 flex-none cursor-pointer items-center rounded-md bg-primary px-3 text-xs font-medium whitespace-nowrap text-white hover:bg-primary/80" @click="openNewForm">+ New event</button>
      </div>

      <div class="relative min-h-0 flex-1 overflow-hidden">
        <div class="absolute inset-0 grid grid-cols-[34px_1fr] grid-rows-[auto_1fr] transition-opacity duration-350 tablet:grid-cols-[40px_1fr]" :class="view === 'calendar' ? 'opacity-100' : 'pointer-events-none opacity-0'">
          <div />
          <div class="grid grid-cols-5 border-b border-border">
            <div v-for="(day, index) in DEMO_DAYS" :key="day" class="px-1 py-2 text-center text-[11px] text-placeholder">
              {{ day }}<b class="block text-sm font-semibold text-foreground">{{ dates[index] }}</b>
            </div>
          </div>
          <div class="relative">
            <span v-for="(label, index) in hourLabels" :key="label" class="absolute right-1.5 -translate-y-1/2 text-[10px] text-zinc-400" :style="{ top: `${index * rowHeight}px` }">{{ label }}</span>
          </div>
          <div
            ref="days"
            data-grid
            class="relative"
            :style="{ backgroundImage: `repeating-linear-gradient(to bottom, #f1f1f3 0 1px, transparent 1px ${rowHeight}px)` }"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @click="onGridClick"
          >
            <div class="pointer-events-none absolute inset-0 grid grid-cols-5">
              <div v-for="(day, index) in DEMO_DAYS" :key="day" class="border-l border-zinc-100" :class="dropDay === index ? 'bg-[#faf9fe]' : ''" />
            </div>
            <div
              v-for="event in visibleEvents"
              :key="event.id"
              :data-event="event.id"
              :data-day="event.day"
              :data-start="event.start"
              :data-hit="hasQuery && hits.includes(event) ? '' : undefined"
              class="absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-[10.5px] leading-tight font-medium select-none transition-[opacity,filter,transform,box-shadow,top,left] duration-250 hover:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)]"
              :class="[
                findAccount(event.account).own ? 'cursor-grab touch-none' : 'cursor-pointer touch-pan-y',
                hasQuery && !hits.includes(event) ? 'opacity-15 grayscale' : '',
                hasQuery && hits.includes(event) ? 'shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--primary)]' : '',
                selectedId === event.id ? 'shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--foreground)]' : '',
                drag?.moved && !drag.locked && drag.event.id === event.id ? 'z-20 scale-[1.04] -rotate-1 cursor-grabbing shadow-[0_18px_30px_-10px_rgba(111,95,184,0.6)]' : '',
                shakingId === event.id ? 'shake' : '',
                popIn ? 'pop-in' : '',
              ]"
              :style="eventStyle(event)"
              role="button"
              tabindex="0"
              @pointerdown="onEventDown($event, event)"
              @keydown.enter="openPanel(event.id)"
              @keydown.space.prevent="openPanel(event.id)"
            >
              {{ event.title }}
              <span v-if="event.length >= 1" class="block text-[9.5px] font-normal opacity-75">{{ formatHour(event.start) }}–{{ formatHour(event.start + event.length) }}</span>
              <span v-if="event.notes.length && event.length >= 1" class="mt-0.5 inline-block rounded-[3px] bg-white px-1 text-[9px] text-placeholder">📝 {{ event.notes.length }}</span>
            </div>
          </div>
        </div>

        <div class="absolute inset-0 bg-white transition-opacity duration-350" :class="view === 'dashboard' ? 'opacity-100' : 'pointer-events-none opacity-0'">
          <LandingDemoDashboard :events="events" :accounts="accounts" :visible-ids="visibleIds" @open="openFromDashboard" />
        </div>

        <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity duration-250" leave-active-class="transition-opacity duration-250">
          <div v-if="selectedEvent" class="absolute inset-0 z-25 bg-black/50" @click="closePanel" />
        </Transition>
        <Transition enter-from-class="translate-x-full" leave-to-class="translate-x-full" enter-active-class="transition-[translate,width] duration-250" leave-active-class="transition-[translate,width] duration-250">
          <div
            v-if="selectedEvent"
            data-panel
            class="absolute inset-y-0 right-0 z-30 flex flex-col border-l border-border bg-white text-xs transition-[width] duration-250"
            :class="noting ? 'w-[94%]' : 'w-[min(340px,62%)]'"
            @keydown="onPanelKeydown"
          >
            <div class="flex h-10 flex-none items-center justify-between gap-2 border-b border-border pr-1.5 pl-3.5">
              <b class="truncate text-[12.5px] font-medium">{{ selectedEvent.title }}</b>
              <button type="button" aria-label="Close" class="grid cursor-pointer place-items-center rounded-md p-[5px] hover:bg-zinc-100" @click="closePanel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-[15px]"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div class="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border-b border-border" :class="noting ? 'grid-cols-[minmax(0,1fr)_min(300px,46%)]' : ''">
              <div v-if="noting" class="flex flex-col gap-3 overflow-auto border-r border-border p-4">
                <div>
                  <b class="block font-medium">Linked note</b>
                  <small class="text-[10.5px] text-placeholder">Will be linked to {{ selectedEvent.title }}</small>
                </div>
                <div>
                  <label for="demo-note-title" class="mb-1.5 block font-medium">Title</label>
                  <input id="demo-note-title" ref="noteTitleInput" v-model="noteTitle" placeholder="Note title" autocomplete="off" class="w-full rounded-md border border-border bg-transparent px-[9px] py-1.5 text-xs shadow-xs outline-none focus:ring-1 focus:ring-zinc-400">
                </div>
                <div>
                  <label for="demo-note-body" class="mb-1.5 block font-medium">Content</label>
                  <textarea id="demo-note-body" v-model="noteBody" placeholder="Write your note..." class="min-h-[130px] w-full resize-none rounded-md border border-border bg-transparent px-[9px] py-1.5 text-xs shadow-xs outline-none focus:ring-1 focus:ring-zinc-400" />
                </div>
              </div>
              <div class="flex flex-col gap-[9px] overflow-auto" :class="noting ? 'bg-zinc-500/5 p-3' : 'p-4'">
                <div class="flex items-start gap-[7px] leading-snug text-zinc-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-px size-[13px] flex-none"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  <span>{{ DEMO_DAYS[selectedEvent.day] }}, Oct {{ dates[selectedEvent.day] }}, 2026, {{ formatHour(selectedEvent.start) }} - {{ formatHour(selectedEvent.start + selectedEvent.length) }}</span>
                </div>
                <div v-if="selectedEvent.where" class="flex items-start gap-[7px] leading-snug text-zinc-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-px size-[13px] flex-none"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                  <span>{{ selectedEvent.where }}</span>
                </div>
                <template v-if="!findAccount(selectedEvent.account).own">
                  <div class="flex items-start gap-[7px] leading-snug text-zinc-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-px size-[13px] flex-none"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span>{{ findAccount(selectedEvent.account).email }}</span>
                  </div>
                  <span class="text-[11px] text-placeholder">Synced from Google · read-only here</span>
                  <a href="#demo" class="text-blue-600 hover:underline" @click.prevent>Link to original event</a>
                </template>
                <div v-if="selectedEvent.description" class="mt-0.5 border-t border-border pt-[9px] leading-normal text-zinc-700">{{ selectedEvent.description }}</div>
                <div v-if="selectedEvent.notes.length" class="mt-0.5 flex flex-col gap-[7px] border-t border-border pt-[9px]">
                  <div class="flex items-center gap-1.5 font-medium text-zinc-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-[13px] flex-none"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" /><path d="M2 6h4M2 10h4M2 14h4M2 18h4" /><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></svg>
                    Notes
                  </div>
                  <div v-for="(note, index) in selectedEvent.notes" :key="index" data-note class="note-in rounded-md border border-border bg-zinc-500/10 p-[9px] hover:border-primary/40 hover:bg-white">
                    <div v-if="editingNote === index" class="flex flex-col gap-1.5">
                      <input v-model="editNoteTitle" data-note-title aria-label="Note title" autocomplete="off" class="w-full rounded-md border border-border bg-white px-[9px] py-1.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400">
                      <textarea v-model="editNoteBody" data-note-body aria-label="Note content" class="min-h-[70px] w-full resize-none rounded-md border border-border bg-white px-[9px] py-1.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400" />
                      <div class="flex gap-1.5">
                        <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/80" @click="saveNoteEdit">Save</button>
                        <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md px-3 text-xs font-medium hover:bg-zinc-100" @click="cancelNoteEdit">Cancel</button>
                      </div>
                    </div>
                    <template v-else>
                      <div class="flex items-start justify-between gap-1">
                        <b class="block font-medium">{{ note.title }}</b>
                        <span class="flex flex-none items-center gap-0.5">
                          <button type="button" aria-label="Edit note" class="grid cursor-pointer place-items-center rounded p-1 text-zinc-500 hover:bg-zinc-100" @click="startNoteEdit(index)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg>
                          </button>
                          <button type="button" aria-label="Delete note" class="grid cursor-pointer place-items-center rounded p-1 text-zinc-500 hover:bg-zinc-100" @click="deletingNote = index">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                          </button>
                        </span>
                      </div>
                      <div class="mt-[3px] line-clamp-3 text-[11px] text-placeholder">{{ note.body }}</div>
                      <div v-if="deletingNote === index" class="mt-1.5 flex items-center gap-1.5">
                        <span class="font-medium">Delete this note?</span>
                        <button type="button" class="inline-flex h-6 cursor-pointer items-center rounded-md bg-[rgb(243,18,96)] px-2.5 text-xs font-medium text-white" @click="deleteNote(index)">Yes</button>
                        <button type="button" class="inline-flex h-6 cursor-pointer items-center rounded-md px-2.5 text-xs font-medium hover:bg-zinc-100" @click="deletingNote = null">No</button>
                      </div>
                    </template>
                  </div>
                </div>
                <button v-if="!noting" type="button" class="flex cursor-pointer items-center justify-between rounded-sm bg-zinc-500/20 px-2.5 py-1.5 font-medium text-placeholder" @click="startNote">
                  Add note
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-[13px]"><path d="M12 5v14M5 12h14" /></svg>
                </button>
                <div v-if="findAccount(selectedEvent.account).own" class="mt-0.5 flex gap-[7px] border-t border-border pt-[9px]">
                  <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/80" @click="openEditForm()">Edit</button>
                  <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md bg-[rgb(243,18,96)] px-3 text-xs font-medium text-white" @click="openEditForm(true)">Delete</button>
                </div>
              </div>
            </div>
            <div v-if="noting" class="flex flex-none justify-end gap-1.5 px-2 py-1.5">
              <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/80 disabled:cursor-default disabled:opacity-45" :disabled="!canSaveNote" @click="saveNote">Save note</button>
              <button type="button" class="inline-flex h-7 cursor-pointer items-center rounded-md px-3 text-xs font-medium hover:bg-zinc-100" @click="noting = false">Cancel</button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="col-start-2 flex min-h-10 items-center gap-2.5 border-t border-border bg-[#fcfcfd] px-3 py-2 text-xs max-desk:hidden">
      <span v-if="mode === 'tour'" class="invite font-semibold text-primary-deep">👆 Click anything to take over</span>
      <template v-else>
        <span class="font-semibold text-primary-deep">● You're in control</span>
        <button type="button" data-resume class="ml-auto cursor-pointer rounded-[7px] border border-border bg-white px-[11px] py-1.5 font-semibold" @click="resumeTour">▶ Resume tour</button>
      </template>
    </div>

    <div v-if="form" class="absolute inset-0 z-50 grid place-items-center bg-black/50" @click.self="form = null">
      <LandingDemoEventForm :draft="form.draft" :editing="form.id !== null" :confirm-delete="form.confirmDelete" @save="saveForm" @cancel="form = null" @delete="deleteFromForm" />
    </div>

    <div class="pointer-events-none absolute z-40 rounded-[7px] bg-foreground px-[9px] py-1.5 text-[11px] whitespace-nowrap text-white transition-[opacity,translate] duration-200" :class="tip.on ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">{{ tip.text }}</div>
  </div>
</template>

<style scoped>
.pop-in {
  animation: pop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(var(--i) * 60ms);
}

.note-in {
  animation: pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.shake {
  animation: shake 0.35s;
}

.invite {
  animation: breathe 2.4s ease-in-out infinite;
}

@keyframes pop {
  from {
    opacity: 0;
    scale: 0.9;
  }
}

@keyframes shake {
  25% {
    translate: -3px 0;
  }
  75% {
    translate: 3px 0;
  }
}

@keyframes breathe {
  50% {
    opacity: 0.45;
  }
}
</style>
