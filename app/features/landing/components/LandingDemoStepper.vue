<script setup lang="ts">
import type { TourStep } from '@shared/api/demo/director-protocol'
import { demoSteps } from '../demo-steps'
import LandingDemoStep from './LandingDemoStep.vue'

const props = defineProps<{ active: TourStep }>()

const activeCopy = computed(() => demoSteps.find((copy) => copy.step === props.active) ?? demoSteps[0]!)

/** Remembers the scroll direction so the next block enters from the side the visitor is scrolling towards. */
const direction = ref<'forward' | 'back'>('forward')
watch(
  () => props.active,
  (next, previous) => {
    direction.value = next >= previous ? 'forward' : 'back'
  },
  { flush: 'sync' },
)
</script>

<template>
  <!-- No `overflow: hidden` here on purpose: the incoming block rises from the bottom of the screen, far outside this box. -->
  <div class="relative">
    <!-- Invisible stack of every step: its height is the tallest step, so the animated blocks never resize the container. -->
    <div class="invisible grid" aria-hidden="true">
      <LandingDemoStep v-for="copy in demoSteps" :key="copy.step" :copy="copy" class="[grid-area:1/1]" />
    </div>

    <Transition :name="`step-${direction}`">
      <LandingDemoStep :key="activeCopy.step" :copy="activeCopy" class="absolute inset-x-0 top-0" />
    </Transition>
  </div>
</template>

<style scoped>
/*
 * Scrolling down: the new block rises from just above the bottom edge of the
 * screen to its pinned spot while the old one lifts a little and fades fast, so
 * the two never read as overlapping text. Scrolling up mirrors it from above.
 * `--rise` is the distance from the pinned top (14vh, see LandingDemo) to the
 * bottom of the viewport, less room for the block itself.
 */
.step-forward-enter-active {
  --rise: calc(100vh - 14vh - 13rem);

  /* Visible almost at once, so the whole climb from the bottom edge can be seen. */
  transition: opacity 0.4s ease, transform 0.9s cubic-bezier(0.25, 0.7, 0.3, 1);
}

.step-back-enter-active {
  /* The fade-in waits a beat so the block dropping out is mostly gone before the new one shows. */
  transition: opacity 0.45s ease 0.15s, transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.step-forward-leave-active,
.step-back-leave-active {
  transition: opacity 0.25s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.step-forward-enter-from {
  opacity: 0;
  transform: translateY(var(--rise));
}

.step-forward-leave-to {
  opacity: 0;
  transform: translateY(-80px);
}

.step-back-enter-from {
  opacity: 0;
  transform: translateY(-80px);
}

.step-back-leave-to {
  opacity: 0;
  transform: translateY(80px);
}

@media (prefers-reduced-motion: reduce) {
  .step-forward-enter-active,
  .step-back-enter-active,
  .step-forward-leave-active,
  .step-back-leave-active {
    transition: none;
  }
}
</style>
