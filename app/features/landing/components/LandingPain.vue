<script setup lang="ts">
import { landingEffects } from '../effects'
import { useReveal } from '../composables/useReveal'

const reducedMotion = usePreferredReducedMotion()
const scenesOn = computed(() => landingEffects.painScenes && reducedMotion.value !== 'reduce')

const header = ref<HTMLElement | null>(null)
const card1 = ref<HTMLElement | null>(null)
const card2 = ref<HTMLElement | null>(null)
const card3 = ref<HTMLElement | null>(null)
const headerShown = useReveal(header)
const card1Shown = useReveal(card1)
const card2Shown = useReveal(card2)
const card3Shown = useReveal(card3)

const go1 = ref(!scenesOn.value)
const go2 = ref(!scenesOn.value)
const go3 = ref(!scenesOn.value)
const sceneTimers: ReturnType<typeof setTimeout>[] = []
let sceneObserver: IntersectionObserver | undefined

const tabOn = 'bg-white text-foreground shadow-[inset_0_-1px_0_var(--border)]'
const tabOff = 'bg-zinc-200 text-placeholder'
const tabColors = ['#f9d3d4', '#cdeedd', '#d3e2fe']
const activeTab = ref(0)

const { pause: stopTabs, resume: startTabs } = useIntervalFn(() => (activeTab.value = (activeTab.value + 1) % 3), 900, { immediate: false })

watch(scenesOn, (on) => {
  if (on) {
    startTabs()
  } else {
    stopTabs()
    activeTab.value = 0
    go1.value = go2.value = go3.value = true
  }
})

onMounted(() => {
  if (!scenesOn.value) return
  startTabs()
  const scenes = [
    { el: card1.value, go: go1 },
    { el: card2.value, go: go2 },
    { el: card3.value, go: go3 },
  ]
  sceneObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const scene = scenes.find((item) => item.el === entry.target)
        sceneObserver?.unobserve(entry.target)
        sceneTimers.push(setTimeout(() => scene && (scene.go.value = true), 350))
      })
    },
    { rootMargin: '-25% 0px -25% 0px', threshold: 0.6 },
  )
  scenes.forEach((scene) => scene.el && sceneObserver?.observe(scene.el))
})

onBeforeUnmount(() => {
  sceneObserver?.disconnect()
  sceneTimers.forEach(clearTimeout)
})
</script>

<template>
  <section id="product" class="mx-auto max-w-[1260px] scroll-mt-20 border-t border-border px-5 py-16 tablet:px-10 tablet:py-[120px]">
    <div ref="header" class="mx-auto max-w-[680px] text-center transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="headerShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
      <span class="text-[13px] font-semibold text-primary-deep">The problem</span>
      <h2 class="mt-2.5 mb-3.5 text-3xl leading-[1.08] font-semibold tracking-[-0.035em] tablet:text-5xl">Your week lives in three places at once</h2>
      <p class="text-base leading-[1.55] text-placeholder">If you work with more than one client, this probably sounds familiar.</p>
    </div>

    <div class="mt-12 grid gap-[18px] tablet:grid-cols-3">
      <div ref="card1" class="relative overflow-hidden rounded-[18px] border border-border bg-white p-6 transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="card1Shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
        <div class="relative h-[120px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
          <div class="flex gap-1 px-2.5 pt-2.5">
            <span class="flex-1 rounded-t-[7px] px-2 py-1.5 text-[10px] transition-colors duration-300" :class="activeTab === 0 ? tabOn : tabOff">acme.com</span>
            <span class="flex-1 rounded-t-[7px] px-2 py-1.5 text-[10px] transition-colors duration-300" :class="activeTab === 1 ? tabOn : tabOff">studio.io</span>
            <span class="flex-1 rounded-t-[7px] px-2 py-1.5 text-[10px] transition-colors duration-300" :class="activeTab === 2 ? tabOn : tabOff">gmail</span>
          </div>
          <div class="relative mx-2.5 h-[62px] rounded-b-lg bg-white">
            <i class="absolute top-3.5 right-[40%] left-2.5 h-4 rounded transition-colors duration-300" :style="{ background: tabColors[activeTab] }" />
          </div>
        </div>
        <h3 class="mt-4 mb-1.5 text-lg font-semibold tracking-[-0.035em]">Tab roulette</h3>
        <p class="text-sm leading-[1.55] text-placeholder">Three Google accounts, three browser tabs. You check all of them before you can say yes to a call.</p>
      </div>

      <div ref="card2" class="relative overflow-hidden rounded-[18px] border border-border bg-white p-6 transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="card2Shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
        <div class="relative h-[120px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
          <div class="absolute inset-x-3.5 top-11 h-9 rounded-lg border border-dashed border-zinc-300">
            <span class="absolute -top-5 left-0 text-[10px] text-placeholder">2:00 pm</span>
          </div>
          <div class="absolute top-[46px] left-4 h-8 w-[44%] rounded-[7px] border-l-[3px] border-[#e5484d] bg-[#fdeaea] px-2.5 py-2 text-[11px] font-medium text-[#b4232a] transition-[translate] duration-[1100ms] ease-[cubic-bezier(.2,.8,.2,1)]" :class="go2 ? ['translate-x-0', scenesOn && 'go-bump'] : '-translate-x-[140%]'">Acme demo</div>
          <div class="absolute top-[46px] right-4 h-8 w-[44%] rounded-[7px] border-l-[3px] border-[#30a46c] bg-[#e6f5ee] px-2.5 py-2 text-[11px] font-medium text-[#1d7a4d] transition-[translate] duration-[1100ms] ease-[cubic-bezier(.2,.8,.2,1)]" :class="go2 ? ['translate-x-0', scenesOn && 'go-bump'] : 'translate-x-[140%]'">Studio QA</div>
          <div class="absolute top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#f6c5c7] bg-white px-2 py-[3px] text-[10px] font-semibold whitespace-nowrap text-[#b4232a] transition-all duration-400 delay-1500" :class="go2 ? 'translate-y-0 opacity-100' : '-translate-y-1.5 opacity-0'">⚠ Same time, two calendars</div>
        </div>
        <h3 class="mt-4 mb-1.5 text-lg font-semibold tracking-[-0.035em]">The silent double-booking</h3>
        <p class="text-sm leading-[1.55] text-placeholder">Client A takes 2pm in their calendar. Client B takes 2pm in theirs. Neither calendar knows about the other.</p>
      </div>

      <div ref="card3" class="relative overflow-hidden rounded-[18px] border border-border bg-white p-6 transition-[opacity,translate] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]" :class="card3Shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
        <div class="relative h-[120px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
          <div class="absolute top-3.5 left-3 rounded-md transition-[translate,rotate] duration-[1400ms] ease-[cubic-bezier(.2,.8,.2,1)] border border-border bg-white px-2 py-1.5 text-[10px] shadow-[0_4px_10px_-6px_rgba(0,0,0,0.2)]" :class="go3 ? '-translate-x-2 translate-y-1.5 -rotate-[8deg]' : ''">📄 Doc: "Acme v2 scope"</div>
          <div class="absolute top-10 right-3 rounded-md transition-[translate,rotate] duration-[1400ms] ease-[cubic-bezier(.2,.8,.2,1)] border border-border bg-white px-2 py-1.5 text-[10px] shadow-[0_4px_10px_-6px_rgba(0,0,0,0.2)]" :class="go3 ? 'translate-x-2.5 -translate-y-1 rotate-6' : ''">💬 Slack: "ship in May?"</div>
          <div class="absolute top-[74px] left-10 rounded-md transition-[translate,rotate] duration-[1400ms] ease-[cubic-bezier(.2,.8,.2,1)] border border-border bg-white px-2 py-1.5 text-[10px] shadow-[0_4px_10px_-6px_rgba(0,0,0,0.2)]" :class="go3 ? '-translate-x-1 translate-y-2 -rotate-3' : ''">📧 Email thread (14)</div>
        </div>
        <h3 class="mt-4 mb-1.5 text-lg font-semibold tracking-[-0.035em]">Notes in the wrong place</h3>
        <p class="text-sm leading-[1.55] text-placeholder">What you agreed on Tuesday is in a Doc, a Slack DM, or nowhere at all. Never next to the meeting.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.go-bump {
  animation: bump 0.5s 1.1s;
}

@keyframes bump {
  30% {
    scale: 1.04;
  }
  60% {
    scale: 0.98;
  }
}
</style>
