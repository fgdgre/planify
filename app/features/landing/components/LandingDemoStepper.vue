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
  <div class="relative overflow-hidden">
    <!-- Invisible stack of every step: its height is the tallest step, so the animated blocks never resize the container. -->
    <div class="invisible grid" aria-hidden="true">
      <LandingDemoStep v-for="copy in demoSteps" :key="copy.step" :copy="copy" class="[grid-area:1/1]" />
    </div>

    <Transition :name="`step-${direction}`">
      <LandingDemoStep :key="activeCopy.step" :copy="activeCopy" class="absolute inset-0" />
    </Transition>
  </div>
</template>

<style scoped>
/* Outgoing block leaves quickly (fade first) while the incoming one lands, so the two never read as overlapping text. */
.step-forward-enter-active,
.step-back-enter-active {
  transition: opacity 0.3s ease-out 0.1s, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.step-forward-leave-active,
.step-back-leave-active {
  transition: opacity 0.14s ease-out, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.step-forward-enter-from,
.step-back-leave-to {
  opacity: 0;
  transform: translateY(48px);
}

.step-forward-leave-to,
.step-back-enter-from {
  opacity: 0;
  transform: translateY(-48px);
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
