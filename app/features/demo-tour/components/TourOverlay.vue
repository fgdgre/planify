<script setup lang="ts">
import { CURSOR_TRAVEL_MS } from '../timing'
import type { OverlayState } from '../visuals'

/**
 * Ghost cursor, click rings, event pulses and the focus glow, drawn above the
 * demo app. Purely decorative: it never receives pointer events, so it cannot
 * be mistaken for (or steal) the visitor's input.
 */
defineProps<{ state: OverlayState }>()

const travel = `${CURSOR_TRAVEL_MS}ms`
</script>

<template>
  <div class="tour-overlay" :class="{ 'tour-overlay--static': state.reducedMotion }" aria-hidden="true">
    <div
      v-if="state.glow"
      class="tour-glow"
      :class="{ 'tour-glow--visible': state.glow.visible }"
      :style="{ transform: `translate(${state.glow.x}px, ${state.glow.y}px)`, width: `${state.glow.width}px`, height: `${state.glow.height}px` }"
    />

    <div
      v-for="pulse in state.pulses"
      :key="pulse.id"
      class="tour-pulse"
      :style="{ transform: `translate(${pulse.x}px, ${pulse.y}px)`, width: `${pulse.width}px`, height: `${pulse.height}px` }"
    />

    <div v-for="ripple in state.ripples" :key="ripple.id" class="tour-ripple" :style="{ left: `${ripple.x}px`, top: `${ripple.y}px` }" />

    <div
      class="tour-cursor"
      :class="{ 'tour-cursor--visible': state.cursor.visible }"
      :style="{ transform: `translate(${state.cursor.x}px, ${state.cursor.y}px)`, '--travel': travel }"
    >
      <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
        <path d="M2 2 L2 20 L7 15.5 L10.5 23 L14 21.5 L10.6 14.2 L17.5 14 Z" fill="var(--primary-deep, #6f5fb8)" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  overflow: hidden;
  pointer-events: none;
}

.tour-cursor {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.3));
  transition: transform var(--travel) cubic-bezier(0.45, 0.05, 0.2, 1), opacity 0.25s ease;
  will-change: transform;
}

.tour-cursor--visible {
  opacity: 1;
}

.tour-glow {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 12px;
  opacity: 0;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary, #9688cf) 70%, transparent), 0 0 28px 6px color-mix(in srgb, var(--primary, #9688cf) 40%, transparent);
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease;
}

.tour-glow--visible {
  opacity: 1;
  animation: tour-breathe 2.4s ease-in-out infinite;
}

.tour-ripple {
  position: absolute;
  width: 44px;
  height: 44px;
  margin: -22px 0 0 -22px;
  border: 2px solid var(--primary-deep, #6f5fb8);
  border-radius: 50%;
  animation: tour-ripple 0.65s ease-out forwards;
}

.tour-pulse {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 8px;
  animation: tour-pulse 1.1s ease-out forwards;
}

.tour-overlay--static .tour-glow {
  transition: none;
}

.tour-overlay--static .tour-glow--visible {
  animation: none;
}

@keyframes tour-breathe {
  50% {
    filter: brightness(1.12);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary, #9688cf) 85%, transparent), 0 0 34px 10px color-mix(in srgb, var(--primary, #9688cf) 50%, transparent);
  }
}

@keyframes tour-ripple {
  from {
    opacity: 0.8;
    transform: scale(0.2);
  }
  to {
    opacity: 0;
    transform: scale(1.5);
  }
}

@keyframes tour-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary, #9688cf) 80%, transparent);
  }
  60% {
    box-shadow: 0 0 0 14px color-mix(in srgb, var(--primary, #9688cf) 0%, transparent), 0 0 24px 6px color-mix(in srgb, var(--primary, #9688cf) 50%, transparent);
  }
  100% {
    box-shadow: 0 0 0 18px transparent;
  }
}
</style>
