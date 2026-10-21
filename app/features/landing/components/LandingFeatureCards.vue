<script setup lang="ts">
import { useReveal } from '../composables/useReveal'

const header = ref<HTMLElement | null>(null)
const tile1 = ref<HTMLElement | null>(null)
const tile2 = ref<HTMLElement | null>(null)
const tile3 = ref<HTMLElement | null>(null)
const tile4 = ref<HTMLElement | null>(null)
const headerShown = useReveal(header)
const tile1Shown = useReveal(tile1)
const tile2Shown = useReveal(tile2)
const tile3Shown = useReveal(tile3)
const tile4Shown = useReveal(tile4)
</script>

<template>
  <section class="mx-auto max-w-[1260px] px-5 pt-5 pb-16 tablet:px-10 tablet:pb-[120px]">
    <div ref="header" class="mx-auto max-w-[680px] text-center transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="headerShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
      <span class="text-[13px] font-semibold text-primary-deep">How Planify helps</span>
      <h2 class="mt-2.5 mb-3.5 text-3xl leading-[1.08] font-semibold tracking-[-0.035em] tablet:text-5xl">
        One grid. Every account.<br>
        <em class="bg-linear-to-r from-primary-deep to-primary bg-clip-text text-transparent not-italic">Context inside.</em>
      </h2>
    </div>

    <div class="mt-11 grid gap-[18px] tablet:grid-cols-[1.2fr_1fr]">
      <div ref="tile1" class="flex flex-col gap-[18px] overflow-hidden rounded-[22px] bg-primary-soft p-7 transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="tile1Shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
        <div>
          <h3 class="text-[22px] font-semibold tracking-[-0.025em]">Every account on one grid</h3>
          <p class="mt-1.5 text-sm leading-[1.5] text-placeholder">Connect up to three Google accounts. Each gets its own color.</p>
        </div>
        <div class="overflow-hidden rounded-xl border border-[#ece9f7] bg-white text-xs shadow-[0_10px_30px_-12px_rgba(111,95,184,0.35)]">
          <div class="grid grid-cols-[28px_repeat(5,1fr)] text-[10px]">
            <div />
            <div class="py-1.5 text-center text-placeholder">Mon</div>
            <div class="py-1.5 text-center text-placeholder">Tue</div>
            <div class="py-1.5 text-center text-placeholder">Wed</div>
            <div class="py-1.5 text-center text-placeholder">Thu</div>
            <div class="py-1.5 text-center text-placeholder">Fri</div>

            <div class="h-11 border-t border-zinc-100 px-1 py-[3px] text-zinc-400">9</div>
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-[3px] z-10 h-20 overflow-hidden rounded-md border-l-[3px] border-[#e5484d] bg-[#fdeaea] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-[#b4232a]">Acme standup</div>
            </div>
            <div class="h-11 border-t border-l border-zinc-100" />
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-2 z-10 h-[52px] overflow-hidden rounded-md border-l-[3px] border-[#30a46c] bg-[#e6f5ee] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-[#1d7a4d]">Studio review</div>
            </div>
            <div class="h-11 border-t border-l border-zinc-100" />
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-[3px] z-10 h-9 overflow-hidden rounded-md border-l-[3px] border-[#e5484d] bg-[#fdeaea] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-[#b4232a]">Acme sync</div>
            </div>

            <div class="h-11 border-t border-zinc-100 px-1 py-[3px] text-zinc-400">10</div>
            <div class="h-11 border-t border-l border-zinc-100" />
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-[3px] z-10 h-20 overflow-hidden rounded-md border-l-[3px] border-[#3e7bfa] bg-[#e8effe] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-[#2357c4]">Dentist</div>
            </div>
            <div class="h-11 border-t border-l border-zinc-100" />
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-1.5 z-10 h-[72px] overflow-hidden rounded-md border-l-[3px] border-primary bg-[#eae7f7] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-primary-deep">Deep work</div>
            </div>
            <div class="h-11 border-t border-l border-zinc-100" />
          </div>
        </div>
      </div>

      <div ref="tile2" class="flex flex-col gap-[18px] overflow-hidden rounded-[22px] bg-primary-soft p-7 transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="tile2Shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
        <div>
          <h3 class="text-[22px] font-semibold tracking-[-0.025em]">Notes inside the meeting</h3>
          <p class="mt-1.5 text-sm leading-[1.5] text-placeholder">Attach notes to any event. Next week, the context is right there.</p>
        </div>
        <div class="overflow-hidden rounded-xl border border-[#ece9f7] bg-white text-xs shadow-[0_10px_30px_-12px_rgba(111,95,184,0.35)]">
          <div class="px-3.5 py-3">
            <span class="rounded bg-[#fde4e5] px-[7px] py-[3px] text-[10px] text-[#b4232a]">acme.com</span>
            <div class="mt-2 text-sm font-semibold">Acme standup</div>
          </div>
          <div class="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2.5">
            <div>
              <b>Scope for v2</b>
              <div class="mt-0.5 text-placeholder">Ship onboarding first, pricing in May.</div>
            </div>
          </div>
          <div class="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2.5 font-semibold text-primary-deep">+ Add note</div>
        </div>
      </div>

      <div ref="tile3" class="flex flex-col gap-[18px] overflow-hidden rounded-[22px] bg-primary-soft p-7 transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="tile3Shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
        <div>
          <h3 class="text-[22px] font-semibold tracking-[-0.025em]">Search every calendar</h3>
          <p class="mt-1.5 text-sm leading-[1.5] text-placeholder">One box over all accounts. Find the last Acme call in two seconds.</p>
        </div>
        <div class="overflow-hidden rounded-xl border border-[#ece9f7] bg-white text-xs shadow-[0_10px_30px_-12px_rgba(111,95,184,0.35)]">
          <div class="px-3.5 py-2.5">🔍 <b>acme</b></div>
          <div class="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2.5">
            <span class="inline-block size-2 rounded-xs bg-[#e5484d]" />
            <span class="flex-1">Acme standup</span>
            <span class="text-placeholder">Mon</span>
          </div>
          <div class="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2.5">
            <span class="inline-block size-2 rounded-xs bg-[#e5484d]" />
            <span class="flex-1">Acme demo</span>
            <span class="text-placeholder">Thu</span>
          </div>
        </div>
      </div>

      <div ref="tile4" class="flex flex-col gap-[18px] overflow-hidden rounded-[22px] bg-primary-soft p-7 transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="tile4Shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
        <div>
          <h3 class="text-[22px] font-semibold tracking-[-0.025em]">Your week at a glance</h3>
          <p class="mt-1.5 text-sm leading-[1.5] text-placeholder">Events per day and what's coming up today, across every account.</p>
        </div>
        <div class="overflow-hidden rounded-xl border border-[#ece9f7] bg-white text-xs shadow-[0_10px_30px_-12px_rgba(111,95,184,0.35)]">
          <div class="px-4 pt-4 pb-2.5">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" class="h-[90px] w-full overflow-visible" aria-hidden="true">
              <path d="M 14 60 C 40 60, 55 30, 82 30 S 120 40, 150 30 S 195 70, 225 70 S 262 25, 286 30 L 286 100 L 14 100 Z" fill="#9688CF" fill-opacity="0.15" />
              <path d="M 14 60 C 40 60, 55 30, 82 30 S 120 40, 150 30 S 195 70, 225 70 S 262 25, 286 30" fill="none" stroke="#9688CF" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke" />
            </svg>
            <div class="mt-1 grid grid-cols-5 text-center text-[10px] text-placeholder">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
