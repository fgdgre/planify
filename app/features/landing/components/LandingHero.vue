<script setup lang="ts">
import { ROUTES } from '@shared/constants/routes'
import { landingEffects } from '../effects'

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
  { day: 0, hour: 0, top: 3, height: 80, title: 'Acme standup', order: 0, note: '📝 2 notes', kind: 'acme' },
  { day: 2, hour: 0, top: 8, height: 52, title: 'Studio review', order: 3, note: '', kind: 'studio' },
  { day: 4, hour: 0, top: 3, height: 36, title: 'Acme sync', order: 6, note: '', kind: 'acme' },
  { day: 1, hour: 1, top: 3, height: 80, title: 'Dentist', order: 1, note: '', kind: 'personal' },
  { day: 3, hour: 1, top: 6, height: 72, title: 'Deep work', order: 4, note: '📝 plan', kind: 'planify' },
  { day: 2, hour: 2, top: 3, height: 38, title: 'Acme 1:1', order: 2, note: '', kind: 'acme' },
  { day: 4, hour: 2, top: 6, height: 60, title: 'Studio call', order: 7, note: '', kind: 'studio' },
  { day: 0, hour: 3, top: 6, height: 36, title: 'Lunch', order: 5, note: '', kind: 'personal' },
  { day: 1, hour: 3, top: 3, height: 60, title: 'Studio QA', order: 8, note: '', kind: 'studio' },
  { day: 3, hour: 4, top: 3, height: 36, title: 'Acme demo', order: 9, note: '', kind: 'acme' },
]

const accounts = [
  { name: 'acme.com', info: 'Client · 14 events', color: '#e5484d', bars: [['#f9d3d4', '80%'], ['#fbe4e5', '55%']] },
  { name: 'studio.io', info: 'Client · 9 events', color: '#30a46c', bars: [['#cdeedd', '65%'], ['#e3f5ec', '85%']] },
  { name: 'gmail.com', info: 'Personal · 6 events', color: '#3e7bfa', bars: [['#d3e2fe', '50%']] },
]

const words = ['client', 'work', 'personal', 'Google']
const reducedMotion = usePreferredReducedMotion()
const rotatingOn = computed(() => landingEffects.rotatingWord && reducedMotion.value !== 'reduce')
const mergeOn = computed(() => landingEffects.merge && reducedMotion.value !== 'reduce')

const activeWord = ref(0)
const leavingWord = ref(-1)
const wordBox = ref<HTMLElement | null>(null)
const wordWidth = ref('')
let leaveTimer: ReturnType<typeof setTimeout> | undefined

function fitWord() {
  const word = wordBox.value?.children[activeWord.value]
  if (word) wordWidth.value = word.getBoundingClientRect().width + 'px'
}

function nextWord() {
  leavingWord.value = activeWord.value
  clearTimeout(leaveTimer)
  leaveTimer = setTimeout(() => (leavingWord.value = -1), 650)
  activeWord.value = (activeWord.value + 1) % words.length
  nextTick(fitWord)
}

const { pause: stopWords, resume: startWords } = useIntervalFn(nextWord, 2200, { immediate: false })

watch(rotatingOn, (on) => (on ? startWords() : stopWords()))

const stage = ref<HTMLElement | null>(null)
const merged = ref(false)
const mountedAt = ref(0)
let mergeTimer: ReturnType<typeof setTimeout> | undefined

function startMerge(delay: number) {
  clearTimeout(mergeTimer)
  mergeTimer = setTimeout(() => (merged.value = true), delay)
}

function replayMerge() {
  merged.value = false
  void stage.value?.offsetWidth
  startMerge(4200)
}

const { stop: stopWatching } = useIntersectionObserver(
  stage,
  ([entry]) => {
    if (!entry?.isIntersecting || !mergeOn.value) return
    stopWatching()
    startMerge(Math.max(0, 900 - (performance.now() - mountedAt.value)) + 4200)
  },
  { threshold: 0.55 },
)

onMounted(() => {
  mountedAt.value = performance.now()
  if (rotatingOn.value) {
    document.fonts.ready.then(fitWord)
    startWords()
  }
})

onBeforeUnmount(() => {
  stopWords()
  clearTimeout(leaveTimer)
  clearTimeout(mergeTimer)
})

function eventsAt(day: number, hour: number) {
  return events.filter((event) => event.day === day && event.hour === hour)
}
</script>

<template>
  <section
    class="relative isolate flex h-[max(640px,calc(100dvh-4rem))] flex-col overflow-hidden px-5 pt-10 text-center tablet:px-10 tablet:pt-14"
    :style="landingEffects.aurora ? undefined : 'background: radial-gradient(ellipse 60% 50% at 50% 0%, #e3dcfb 0%, transparent 70%)'"
  >
    <div v-if="landingEffects.aurora" class="aurora pointer-events-none absolute -inset-x-[10%] -top-[20%] -z-10 h-[780px] opacity-65 blur-[60px]">
      <span /><span /><span />
    </div>

    <div class="flex flex-1 flex-col items-center justify-center">
      <span class="inline-flex items-center gap-2 rounded-full border border-border bg-white py-[5px] pr-3 pl-1.5 text-[13px] text-zinc-700">
        <span class="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
        Notes inside every meeting
      </span>

      <h1 class="mx-auto mt-5 max-w-[820px] text-4xl leading-[1.05] font-semibold tracking-[-0.035em] tablet:text-6xl">
        All your
        <span
          v-if="rotatingOn"
          ref="wordBox"
          class="inline-grid h-[calc(1lh+.22em)] justify-items-start overflow-hidden align-top -mb-[.22em] transition-[width] duration-600 ease-[cubic-bezier(.2,.8,.2,1)]"
          :style="{ width: wordWidth || undefined }"
        >
          <b
            v-for="(word, index) in words"
            :key="word"
            class="col-start-1 row-start-1 font-semibold whitespace-nowrap transition-[transform,opacity] duration-600 ease-[cubic-bezier(.2,.8,.2,1)]"
            :class="index === activeWord ? 'opacity-100' : index === leavingWord ? '-translate-y-[150%] opacity-0' : 'translate-y-[150%] opacity-0'"
          >{{ word }}</b>
        </span>
        <b v-else class="font-semibold">Google</b>
        calendars.<br>
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
    </div>

    <div
      ref="stage"
      class="relative mx-auto mt-8 min-h-[220px] w-full max-w-[1180px] shrink overflow-hidden pt-4"
      :class="{ merged: mergeOn && merged, 'merge-on': mergeOn }"
    >
      <template v-if="mergeOn">
        <div
          v-for="account in accounts"
          :key="account.name"
          class="acct pointer-events-none absolute top-0 hidden w-[230px] rounded-[14px] border border-border bg-white p-3.5 text-left text-[13px] tablet:block"
        >
          <span class="mr-1 inline-block size-2 rounded-full" :style="{ background: account.color }" />
          <b class="font-semibold">{{ account.name }}</b>
          <small class="mt-0.5 block text-placeholder">{{ account.info }}</small>
          <div
            v-for="bar in account.bars"
            :key="bar[0]"
            class="mt-2 h-1.5 rounded-[3px]"
            :style="{ background: bar[0], width: bar[1] }"
          />
        </div>
        <button
          type="button"
          class="absolute top-[138px] right-3.5 z-20 hidden cursor-pointer rounded-[7px] border border-border bg-white px-2.5 py-1.5 text-[11px] tablet:block"
          @click="replayMerge"
        >
          ↻ Replay
        </button>
      </template>

      <div
        class="grid overflow-hidden rounded-t-2xl border border-b-0 border-border bg-white text-left shadow-[0_40px_120px_-40px_rgba(111,95,184,0.55)] tablet:grid-cols-[170px_1fr]"
        :class="{ 'tablet:mt-[110px]': mergeOn }"
      >
        <div class="hidden flex-col gap-2.5 bg-sidebar-background p-4 text-xs text-zinc-300 tablet:flex">
          <span class="flex items-center gap-2 text-[13px] font-semibold text-white">
            <span class="inline-block size-4 rounded bg-primary" />
            Planify
          </span>
          <span class="mt-2 text-zinc-500">Calendars</span>
          <span v-for="calendar in calendars" :key="calendar.name" class="side-row flex items-center gap-2">
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
                class="ev absolute inset-x-1 z-10 overflow-hidden rounded-md border-l-[3px] px-[7px] py-[5px] text-[10px] leading-tight font-medium"
                :style="{ top: event.top + 'px', height: event.height + 'px', '--i': event.order, ...eventStyles[event.kind as keyof typeof eventStyles] }"
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
    </div>
  </section>
</template>

<style scoped>
.aurora span {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: multiply;
  animation: drift 18s ease-in-out infinite alternate;
}
.aurora span:nth-child(1) { width: 520px; height: 420px; left: 22%; top: 0; background: #cfc6f2; }
.aurora span:nth-child(2) { width: 420px; height: 380px; left: 48%; top: 60px; background: #e3dcfb; animation-duration: 22s; }
.aurora span:nth-child(3) { width: 360px; height: 300px; left: 36%; top: 180px; background: #d9eefc; animation-duration: 26s; }
@keyframes drift {
  to { transform: translate(60px, 40px) scale(1.12); }
}

.acct {
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.25);
  transition: transform 1.7s cubic-bezier(.2, .8, .2, 1), opacity 1.3s 0.3s;
  animation: levitate 3.2s ease-in-out infinite;
}
.acct:nth-of-type(1) { left: 6%; transform: rotate(-6deg); }
.acct:nth-of-type(2) { left: calc(50% - 115px); top: -18px; transform: rotate(1deg); animation-delay: -1.1s; }
.acct:nth-of-type(3) { right: 6%; transform: rotate(5deg); animation-delay: -2.2s; }
@keyframes levitate {
  0%, 100% { translate: 0 0; rotate: 0deg; }
  40% { translate: 0 -14px; rotate: 0deg; }
  46% { translate: 0 -14px; rotate: -2.5deg; }
  52% { translate: 0 -14px; rotate: 2.5deg; }
  58% { translate: 0 -14px; rotate: -1.5deg; }
  64% { translate: 0 -13px; rotate: 1deg; }
  70% { translate: 0 -12px; rotate: 0deg; }
}

.merge-on .side-row { opacity: 0.35; transition: opacity 0.8s 1.2s; }
.merge-on .ev { opacity: 0; transform: translateY(-14px) scale(0.96); transition: opacity 0.4s, transform 0.4s cubic-bezier(.2, .8, .2, 1); }
.merged .side-row { opacity: 1; }
.merged .ev { opacity: 1; transform: none; transition-duration: 0.7s; transition-delay: calc(var(--i) * 150ms + 1300ms); }
.merged .acct:nth-of-type(1) { transform: translate(140px, 190px) scale(0.4) rotate(0); opacity: 0; }
.merged .acct:nth-of-type(2) { transform: translate(0, 210px) scale(0.4); opacity: 0; transition-delay: 0.2s; }
.merged .acct:nth-of-type(3) { transform: translate(-140px, 190px) scale(0.4) rotate(0); opacity: 0; transition-delay: 0.4s; }
</style>
