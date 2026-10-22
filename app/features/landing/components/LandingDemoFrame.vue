<script setup lang="ts">
import type { TourStep } from '@shared/api/demo/director-protocol'
import { useDemoFrame } from '../composables/useDemoFrame'

const props = defineProps<{ step: TourStep }>()

const DEMO_URL = '/demo/calendar'
/** The app always renders at this desktop size and is scaled down to the frame, so its layout never gets squeezed. */
const APP_WIDTH = 1280
const APP_HEIGHT = 800

const section = ref<HTMLElement | null>(null)
const frame = ref<HTMLIFrameElement | null>(null)
const isDesk = useMediaQuery('(min-width: 1150px)')

/** The room the section leaves for the demo; on desktop the app is scaled to fit all of it, width and height. */
const area = ref<HTMLElement | null>(null)
const { width: areaWidth, height: areaHeight } = useElementSize(area)
const scale = computed(() => {
  if (!isDesk.value) return areaWidth.value ? areaWidth.value / APP_WIDTH : 1
  return Math.min(areaWidth.value / APP_WIDTH, areaHeight.value / APP_HEIGHT)
})
const boxStyle = computed(() => (isDesk.value ? { width: `${APP_WIDTH * scale.value}px`, height: `${APP_HEIGHT * scale.value}px` } : undefined))
// `saveData` is not in the DOM typings; the poster is the whole experience for these visitors.
const saveData = typeof navigator !== 'undefined' && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
const enabled = computed(() => isDesk.value && !saveData)

const { status, iframeSrc, controlled, goToStep, takeControl, resume } = useDemoFrame({ section, frame, enabled, demoUrl: DEMO_URL })

watch(() => props.step, goToStep)

const showLink = computed(() => status.value === 'fallback' || !enabled.value)
</script>

<template>
  <div ref="section" class="flex flex-col gap-3 desk:h-full">
   <div ref="area" class="desk:min-h-0 desk:flex-1">
    <div class="relative mx-auto h-[460px] w-full overflow-hidden rounded-2xl desk:h-auto desk:w-auto border border-border bg-white shadow-[0_30px_80px_-30px_rgba(60,40,120,.35)]" :style="boxStyle">
      <img
        src="/landing/demo-poster.webp"
        srcset="/landing/demo-poster.webp 1x, /landing/demo-poster@2x.webp 2x"
        alt="Planify calendar showing the week with events from several accounts"
        width="1280"
        height="800"
        loading="lazy"
        decoding="async"
        class="absolute inset-0 size-full object-cover object-top-left transition-opacity duration-300"
        :class="status === 'ready' ? 'opacity-0' : 'opacity-100'"
      >

      <iframe
        v-if="iframeSrc"
        ref="frame"
        :src="iframeSrc"
        title="Interactive Planify demo"
        loading="lazy"
        sandbox="allow-scripts"
        class="absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-300"
        :style="{ width: `${APP_WIDTH}px`, height: `${APP_HEIGHT}px`, transform: `scale(${scale})` }"
        :class="status !== 'ready' ? 'pointer-events-none opacity-0' : controlled ? 'opacity-100' : 'pointer-events-none opacity-100'"
      />

      <!-- While the tour drives the demo the frame ignores the pointer, so wheel scrolling over it scrolls the page; this button hands the demo over to the visitor. -->
      <button
        v-if="status === 'ready' && !controlled"
        type="button"
        class="group absolute inset-0 flex cursor-pointer items-end justify-center pb-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        @click="takeControl"
      >
        <span class="rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Click to try it yourself
        </span>
      </button>

      <div v-if="controlled" class="absolute right-4 bottom-4 flex items-center gap-3 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-white shadow-lg">
        <span><span class="text-primary-soft">●</span> You're in control</span>
        <button type="button" class="cursor-pointer rounded-full bg-primary px-3 py-1 text-white transition-colors hover:bg-primary-deep" @click="resume">
          ▶ Resume tour
        </button>
      </div>
    </div>
   </div>

    <a
      v-if="showLink"
      :href="DEMO_URL"
      target="_blank"
      rel="noopener"
      class="shrink-0 self-center text-sm font-semibold text-primary-deep underline-offset-4 hover:underline"
    >
      Open the live demo
    </a>
  </div>
</template>
