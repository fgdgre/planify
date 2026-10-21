<script setup lang="ts">
import { useReveal } from '../composables/useReveal'
import LandingDemoApp from './LandingDemoApp.vue'

const steps = [
  { number: '01 · Unified calendar', title: 'Every account on one grid', text: 'Connect up to three Google accounts. Each gets its own color, so you see whose meeting it is at a glance.', hint: 'Try it: switch an account off in the sidebar.' },
  { number: '02 · Your own events', title: 'Plan your own time', text: 'Click any free slot to add an event, then edit, drag or delete it. Synced Google events stay read-only.', hint: 'Try it: click an empty slot in the grid.' },
  { number: '03 · Notes', title: 'Notes that live inside the meeting', text: 'Attach notes to any event, or write one while creating it. Open the meeting next week and the context is right there.', hint: 'Try it: click any event and add a note.' },
  { number: '04 · Search', title: 'Find anything, across every account', text: 'One search box over all your calendars. "When did I last talk to Acme?" takes two seconds.', hint: 'Try it: type "studio" and press Enter.' },
  { number: '05 · Dashboard', title: 'Your week at a glance', text: 'Events per day, what\'s coming up today and your schedule, across every account.', hint: 'Try it: open Dashboard, then add an event and watch it update.' },
]

const header = ref<HTMLElement | null>(null)
const headerShown = useReveal(header)

const isDesk = useMediaQuery('(min-width: 1150px)')
const stepBlocks = ref<HTMLElement[]>([])
const activeStep = ref<1 | 2 | 3 | 4 | 5 | null>(null)
const controlled = ref(false)
const appStep = computed(() => (isDesk.value && !controlled.value ? activeStep.value : null))

let stepObserver: IntersectionObserver | undefined

onMounted(() => {
  stepObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const index = stepBlocks.value.indexOf(entry.target as HTMLElement)
        if (index >= 0) activeStep.value = (index + 1) as 1 | 2 | 3 | 4 | 5
      })
    },
    { rootMargin: '-45% 0px -45% 0px' },
  )
  stepBlocks.value.forEach((block) => stepObserver?.observe(block))
})

onBeforeUnmount(() => stepObserver?.disconnect())
</script>

<template>
  <section id="demo" class="mx-auto max-w-[1560px] scroll-mt-20 px-5 pt-5 pb-16 tablet:px-10 desk:pb-[120px]">
    <div ref="header" class="mx-auto max-w-[680px] text-center transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="headerShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
      <span class="text-[13px] font-semibold text-primary-deep">How Planify helps</span>
      <h2 class="mt-2.5 mb-3.5 text-3xl leading-[1.08] font-semibold tracking-[-0.035em] tablet:text-5xl">
        One grid. Every account.<br>
        <em class="bg-linear-to-r from-primary-deep to-primary bg-clip-text text-transparent not-italic">Context inside.</em>
      </h2>
    </div>

    <div class="mt-11 desk:mt-10 desk:grid desk:grid-cols-[minmax(260px,.62fr)_1.9fr] desk:gap-12">
      <div class="max-desk:hidden">
        <div
          v-for="(step, index) in steps"
          :key="step.number"
          ref="stepBlocks"
          class="flex min-h-[78vh] flex-col justify-center transition-opacity duration-500"
          :class="activeStep === index + 1 ? 'opacity-100' : 'opacity-25'"
        >
          <span class="text-xs font-semibold text-primary-deep">{{ step.number }}</span>
          <h3 class="mt-2.5 mb-3 text-[34px] leading-[1.1] font-semibold tracking-[-0.035em]">{{ step.title }}</h3>
          <p class="text-base leading-[1.55] text-placeholder">{{ step.text }}</p>
          <p class="mt-3.5 text-[13px] font-semibold text-primary-deep">{{ step.hint }}</p>
        </div>
      </div>
      <div>
        <div class="h-[560px] desk:sticky desk:top-[14vh] desk:h-[72vh]">
          <LandingDemoApp :step="appStep" @take-control="controlled = true" @resume="controlled = false" />
        </div>
      </div>
    </div>
  </section>
</template>
