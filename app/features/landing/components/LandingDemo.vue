<script setup lang="ts">
import { TOUR_STEPS, type TourStep } from '@shared/api/demo/director-protocol'
import { useReveal } from '../composables/useReveal'
import LandingDemoFrame from './LandingDemoFrame.vue'
import LandingDemoStepper from './LandingDemoStepper.vue'

const header = ref<HTMLElement | null>(null)
const headerShown = useReveal(header)

const sentinels = ref<HTMLElement[]>([])
const activeStep = ref<TourStep>(1)

let sentinelObserver: IntersectionObserver | undefined

onMounted(() => {
  // A sentinel is "active" while it crosses a thin band in the middle of the viewport.
  sentinelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const index = sentinels.value.indexOf(entry.target as HTMLElement)
        const step = TOUR_STEPS[index]
        if (step) activeStep.value = step
      })
    },
    { rootMargin: '-45% 0px -45% 0px' },
  )
  sentinels.value.forEach((sentinel) => sentinelObserver?.observe(sentinel))
})

onBeforeUnmount(() => sentinelObserver?.disconnect())
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
      <!-- Left column is as tall as the five scroll sentinels; the step text and the frame both pin to the same `top` with the same height, so they unpin together and their top edges stay on one line. -->
      <div class="relative min-h-[500vh] max-desk:hidden">
        <div class="sticky top-[14vh] h-[72vh]">
          <LandingDemoStepper :active="activeStep" />
        </div>
        <div class="pointer-events-none absolute inset-0 flex flex-col" aria-hidden="true">
          <div v-for="step in TOUR_STEPS" :key="step" ref="sentinels" data-testid="demo-step-sentinel" class="h-screen shrink-0" />
        </div>
      </div>
      <div>
        <div class="h-[560px] desk:sticky desk:top-[14vh] desk:h-[72vh]">
          <LandingDemoFrame :step="activeStep" />
        </div>
      </div>
    </div>
  </section>
</template>
