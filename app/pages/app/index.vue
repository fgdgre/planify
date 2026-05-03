<script setup lang="ts">
import { useDashboard } from '@features/dashboard'
import { EventsLineChart } from '@entities/charts'
import { NotesItem } from '@features/notes'

definePageMeta({
  title: 'Home',
  layout: 'app',
  middleware: ['google-calendar-events'],
})

const {
  todaysEventNotes,
  todaysEvents,
  notesByEventId,
  buckets,
  stats,
  formatTime,
  eventBarColor,
  openEventView,
  openNoteInEventSidebar,
  openCreateNote,
  goCalendar,
  handleDeleteNote,
  load,
} = useDashboard()

await load()
</script>

<template>
  <div class="flex-1 overflow-auto">
    <section
      class="flex flex-col gap-16 px-6 py-24 bg-[linear-gradient(135deg,#fff_0%,rgba(150,136,207,0.05)_50%,#fff_100%)]"
    >
      <div class="flex flex-col gap-6 max-w-[768px]">
        <h1 class="text-[60px] leading-[60px] font-medium text-black">
          Add your plans for today<br />
          <span class="text-primary">and a couple of easy tips</span>
        </h1>
        <p class="text-xl leading-7 text-black/60 max-w-[576px]">
          Choose an account, day, time, write notes and colour according to your mood
        </p>
        <div class="flex items-center gap-4">
          <SupaButton
            color="primary"
            icon="lucide:calendar"
            :ui="{
              button: 'text-white rounded-[14px] text-base px-8 py-4 h-auto',
              icon: 'order-last',
            }"
            @click="goCalendar"
          >
            Open Calendar
          </SupaButton>
          <SupaButton
            color="primary"
            outline
            :ui="{ button: 'rounded-[14px] text-base px-8 py-4 h-auto' }"
            @click="openCreateNote"
          >
            Add Note
          </SupaButton>
        </div>
      </div>

      <div class="border border-black/10 bg-white rounded-2xl p-8 flex flex-col gap-4">
        <EventsLineChart :buckets="buckets" />

        <div class="flex justify-between gap-2">
          <div
            v-for="bucket in buckets"
            :key="bucket.dayIndex"
            class="flex-1 flex flex-col items-center"
          >
            <span class="text-xs leading-4 font-medium text-black/40 text-center">{{ bucket.shortLabel }}</span>
            <span class="text-sm leading-5 text-black/60 text-center">{{ bucket.date }}</span>
          </div>
        </div>

        <div class="border-t border-black/10 pt-6 text-sm leading-5 text-black/50 text-center">
          Event distribution for this week
        </div>
      </div>
    </section>

    <section class="flex flex-wrap gap-6 px-6 py-16">
      <div
        v-for="(stat, i) in stats"
        :key="stat.label"
        class="flex-1 min-w-[280px] border border-black/10 rounded-[14px] p-8 flex flex-col gap-4 bg-white"
      >
        <div
          class="size-12 rounded-[10px] flex items-center justify-center"
          :class="i % 2 === 0 ? 'bg-[rgba(150,136,207,0.08)]' : ''"
        >
          <SupaIcon :name="stat.icon" :ui="{ icon: 'size-6 text-foreground' }" />
        </div>
        <p class="text-4xl leading-10 font-medium text-black">{{ stat.value }}</p>
        <p class="text-sm leading-5 text-black/50">{{ stat.label }}</p>
      </div>
    </section>

    <section
      class="px-6 pt-16 flex flex-col gap-8 min-h-[400px] bg-[linear-gradient(180deg,#fff_0%,rgba(150,136,207,0.05)_100%)]"
    >
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-3xl leading-9 font-medium text-black">Today's Schedule</h2>
        <NuxtLink class="text-sm text-primary underline underline-offset-2" to="/app/calendar">
          View all
        </NuxtLink>
      </div>

      <div class="flex flex-col w-full gap-3">
        <div
          v-if="todaysEvents.length === 0"
          class="p-8 border border-dashed border-black/10 rounded-[14px] text-center text-sm text-black/45"
        >
          Nothing scheduled for today.
        </div>

        <div
          v-for="event in todaysEvents"
          :key="event.id"
          class="flex items-center gap-6 p-[24.8px] bg-white border border-black/10 rounded-[14px] w-full text-left cursor-pointer transition-colors hover:border-primary/50"
          role="button"
          tabindex="0"
          @click="openEventView(event)"
          @keydown.enter.prevent="openEventView(event)"
          @keydown.space.prevent="openEventView(event)"
        >
          <span class="w-16 text-sm leading-5 font-medium text-black/40 shrink-0">
            {{ formatTime(event.start_at) }}
          </span>
          <span
            class="w-1 h-12 rounded-full shrink-0"
            :style="{ background: eventBarColor(event) }"
          />
          <div class="flex flex-col gap-1 min-w-0">
            <p class="text-base leading-6 font-medium text-black truncate">
              {{ event.title || '(No title)' }}
            </p>
            <p v-if="event.creator_email" class="text-sm leading-5 text-black/50">
              {{ event.creator_email }}
            </p>

            <div
              v-if="notesByEventId.get(event.id)?.length"
              class="flex flex-wrap gap-1.5 mt-1.5"
              @click.stop
            >
              <button
                v-for="note in notesByEventId.get(event.id)"
                :key="note.id"
                type="button"
                class="inline-flex items-center gap-1.5 max-w-[220px] px-2.5 py-1 bg-primary/10 text-foreground rounded-full text-xs leading-4 cursor-pointer transition-colors hover:bg-primary/20"
                @click="openEventView(event, note)"
              >
                <SupaIcon name="lucide:notebook-pen" :ui="{ icon: 'size-3.5 shrink-0' }" />
                <span class="truncate">{{ note.title }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 pb-16">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-3xl leading-9 font-medium text-black">Notes for today's events</h2>
          <NuxtLink class="text-sm text-primary underline underline-offset-2" to="/app/notes">
            View all
          </NuxtLink>
        </div>

        <div
          v-if="todaysEventNotes.length === 0"
          class="p-8 border border-dashed border-black/10 rounded-[14px] text-center text-sm text-black/45"
        >
          No notes linked to today's events.
        </div>

        <div
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(300px,360px))] gap-4 justify-start"
        >
          <NotesItem
            v-for="note in todaysEventNotes"
            :key="note.id"
            :item="note"
            class="bg-white"
            @view="() => openNoteInEventSidebar(note)"
            @delete="() => handleDeleteNote(note)"
          />
        </div>
      </div>
    </section>
  </div>
</template>
