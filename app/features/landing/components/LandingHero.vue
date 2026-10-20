<script setup lang="ts">
import { ROUTES } from '@shared/constants/routes'

const calendars = [
  { name: 'acme.com', color: '#e5484d' },
  { name: 'studio.io', color: '#30a46c' },
  { name: 'personal', color: '#3e7bfa' },
  { name: 'Planify', color: '#9688CF' },
]

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const hours = ['9 am', '10', '11', '12', '1 pm', '2']

const eventStyles = {
  acme: { background: '#fdeaea', color: '#b4232a', borderColor: '#e5484d' },
  studio: { background: '#e6f5ee', color: '#1d7a4d', borderColor: '#30a46c' },
  personal: { background: '#e8effe', color: '#2357c4', borderColor: '#3e7bfa' },
  planify: { background: '#eae7f7', color: '#6f5fb8', borderColor: '#9688CF' },
}

const events = [
  { day: 0, hour: 0, top: 3, height: 80, title: 'Acme standup', note: '📝 2 notes', kind: 'acme' },
  { day: 2, hour: 0, top: 8, height: 52, title: 'Studio review', note: '', kind: 'studio' },
  { day: 4, hour: 0, top: 3, height: 36, title: 'Acme sync', note: '', kind: 'acme' },
  { day: 1, hour: 1, top: 3, height: 80, title: 'Dentist', note: '', kind: 'personal' },
  { day: 3, hour: 1, top: 6, height: 72, title: 'Deep work', note: '📝 plan', kind: 'planify' },
  { day: 2, hour: 2, top: 3, height: 38, title: 'Acme 1:1', note: '', kind: 'acme' },
  { day: 4, hour: 2, top: 6, height: 60, title: 'Studio call', note: '', kind: 'studio' },
  { day: 0, hour: 3, top: 6, height: 36, title: 'Lunch', note: '', kind: 'personal' },
  { day: 1, hour: 3, top: 3, height: 60, title: 'Studio QA', note: '', kind: 'studio' },
  { day: 3, hour: 4, top: 3, height: 36, title: 'Acme demo', note: '', kind: 'acme' },
]

function eventsAt(day: number, hour: number) {
  return events.filter((event) => event.day === day && event.hour === hour)
}
</script>

<template>
  <section
    class="relative overflow-hidden px-5 pt-10 text-center tablet:px-10 tablet:pt-14"
    style="background: radial-gradient(ellipse 60% 50% at 50% 0%, #e3dcfb 0%, transparent 70%)"
  >
    <span class="inline-flex items-center gap-2 rounded-full border border-border bg-white py-[5px] pr-3 pl-1.5 text-[13px] text-zinc-700">
      <span class="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
      Notes inside every meeting
    </span>

    <h1 class="mx-auto mt-5 max-w-[820px] text-4xl leading-[1.05] font-semibold tracking-[-0.035em] tablet:text-6xl">
      All your <b class="font-semibold">Google</b> calendars.<br>
      <em class="bg-linear-to-r from-primary-deep to-primary bg-clip-text text-transparent not-italic">One calm place.</em>
    </h1>

    <p class="mx-auto mt-4 max-w-[560px] text-[17px] leading-[1.55] text-placeholder">
      Stop flipping between client accounts. Planify shows every calendar on one grid and keeps your meeting notes right where you need them.
    </p>

    <div class="mt-6 flex flex-wrap justify-center gap-2.5">
      <NuxtLink
        :to="ROUTES.SIGNUP"
        class="rounded-[9px] bg-primary px-[18px] py-[11px] text-sm font-semibold text-white shadow-[0_8px_24px_-10px_var(--primary-deep)]"
      >
        Connect Google Calendar
      </NuxtLink>
      <a
        href="#how-it-works"
        class="rounded-[9px] border border-border bg-white px-[18px] py-[11px] text-sm font-semibold"
      >
        See how it works
      </a>
    </div>

    <div
      class="mx-auto mt-12 grid max-w-[1180px] overflow-hidden rounded-t-2xl border border-b-0 border-border bg-white text-left shadow-[0_40px_120px_-40px_rgba(111,95,184,0.55)] tablet:grid-cols-[170px_1fr]"
    >
      <div class="hidden flex-col gap-2.5 bg-sidebar-background p-4 text-xs text-zinc-300 tablet:flex">
        <span class="flex items-center gap-2 text-[13px] font-semibold text-white">
          <span class="inline-block size-4 rounded bg-primary" />
          Planify
        </span>
        <span class="mt-2 text-zinc-500">Calendars</span>
        <span v-for="calendar in calendars" :key="calendar.name" class="flex items-center gap-2">
          <span class="size-2 flex-none rounded-xs" :style="{ background: calendar.color }" />
          {{ calendar.name }}
        </span>
      </div>

      <div class="grid grid-cols-[40px_repeat(5,1fr)] text-[10.5px]">
        <div />
        <div v-for="day in days" :key="day" class="border-b border-border px-1 py-2 text-center text-placeholder">
          {{ day }}
        </div>

        <template v-for="(hour, hourIndex) in hours" :key="hour">
          <div class="h-11 border-t border-zinc-100 px-1.5 py-[3px] text-zinc-400">{{ hour }}</div>
          <div
            v-for="(day, dayIndex) in days"
            :key="day"
            class="relative h-11 border-t border-l border-zinc-100"
          >
            <div
              v-for="event in eventsAt(dayIndex, hourIndex)"
              :key="event.title"
              class="absolute inset-x-1 z-10 overflow-hidden rounded-md border-l-[3px] px-[7px] py-[5px] text-[10px] leading-tight font-medium"
              :style="{ top: event.top + 'px', height: event.height + 'px', ...eventStyles[event.kind as keyof typeof eventStyles] }"
            >
              {{ event.title }}
              <template v-if="event.note">
                <br>
                <span class="mt-[3px] inline-block rounded-[3px] bg-white px-[5px] py-px text-[9px] text-placeholder">{{ event.note }}</span>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
