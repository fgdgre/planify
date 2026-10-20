<script setup lang="ts">
import { landingEffects } from '../effects'
import { useReveal } from '../composables/useReveal'

const steps = [
  { title: 'Connect Google', text: 'Sign in and link up to three Google accounts.' },
  { title: 'Pick colors', text: 'Choose which calendars to show and a color per account.' },
  { title: 'Plan in one place', text: 'Create events, drag them around, add notes as you go.' },
]

const reducedMotion = usePreferredReducedMotion()
const lightOn = computed(() => landingEffects.cursorLight && reducedMotion.value !== 'reduce')

const header = ref<HTMLElement | null>(null)
const headerShown = useReveal(header)
const cardEls = [ref<HTMLElement | null>(null), ref<HTMLElement | null>(null), ref<HTMLElement | null>(null)]
const cardsShown = [useReveal(cardEls[0]!), useReveal(cardEls[1]!), useReveal(cardEls[2]!)]

function moveLight(event: PointerEvent) {
  if (!lightOn.value) return
  const card = event.currentTarget as HTMLElement
  const box = card.getBoundingClientRect()
  card.style.setProperty('--x', event.clientX - box.left + 'px')
  card.style.setProperty('--y', event.clientY - box.top + 'px')
}
</script>

<template>
  <section id="how-it-works" class="mx-auto max-w-[1260px] scroll-mt-20 px-5 pt-5 pb-16 tablet:px-10 tablet:pb-[120px]">
    <div ref="header" class="mx-auto max-w-[680px] text-center transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="headerShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
      <span class="text-[13px] font-semibold text-primary-deep">Get started</span>
      <h2 class="mt-2.5 mb-3.5 text-3xl leading-[1.08] font-semibold tracking-[-0.035em] tablet:text-5xl">Set up in under a minute</h2>
    </div>

    <div class="mt-12 grid gap-[18px] tablet:grid-cols-3">
      <div
        v-for="(step, index) in steps"
        :key="step.title"
        :ref="cardEls[index]"
        class="group relative overflow-hidden rounded-[18px] border border-border bg-white p-6 transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]"
        :class="cardsShown[index]!.value ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        @pointermove="moveLight"
      >
        <div
          v-if="lightOn"
          class="pointer-events-none absolute inset-0 bg-[radial-gradient(300px_circle_at_var(--x,50%)_var(--y,50%),rgba(150,136,207,0.22),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div class="relative mb-4 grid size-[30px] place-items-center rounded-full bg-primary text-[13px] font-semibold text-white">{{ index + 1 }}</div>
        <h4 class="relative mb-1.5 text-base font-semibold tracking-[-0.035em]">{{ step.title }}</h4>
        <p class="relative text-sm leading-[1.5] text-placeholder">{{ step.text }}</p>
      </div>
    </div>
  </section>
</template>
