<script setup lang="ts">
const steps = [
  { title: 'Connect Google', text: 'Sign in and link up to three Google accounts.' },
  { title: 'Pick colors', text: 'Choose which calendars to show and a color per account.' },
  { title: 'Plan in one place', text: 'Create events, drag them around, add notes as you go.' },
]
</script>

<template>
  <section id="how-it-works" class="mx-auto max-w-[1260px] scroll-mt-20 px-5 pt-5 pb-16 tablet:px-10 tablet:pb-[120px]">
    <div class="mx-auto max-w-[680px] text-center">
      <span class="text-[13px] font-semibold text-primary-deep">Get started</span>
      <h2 class="mt-2.5 mb-3.5 text-3xl leading-[1.08] font-semibold tracking-[-0.035em] tablet:text-5xl">Set up in under a minute</h2>
    </div>

    <div class="mt-12 grid gap-[18px] tablet:grid-cols-3">
      <div v-for="(step, index) in steps" :key="step.title" class="relative overflow-hidden rounded-[18px] border border-border bg-white p-6">
        <div class="mb-4 grid size-[30px] place-items-center rounded-full bg-primary text-[13px] font-semibold text-white">{{ index + 1 }}</div>
        <h4 class="mb-1.5 text-base font-semibold tracking-[-0.035em]">{{ step.title }}</h4>
        <p class="text-sm leading-[1.5] text-placeholder">{{ step.text }}</p>
      </div>
    </div>
  </section>
</template>
