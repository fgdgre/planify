<script setup lang="ts">
import * as progressVariants from './progress'

defineProps<{
  infinite?: boolean
  width?: number
  status?: 'error'
  background?: 'theme' | 'transparent'
  color?: 'primary' | 'error' | 'primary-light' | 'success' | 'default'
  size?: 'sm' | 'md'
  ui?: { wrapper?: string; progress?: string }
}>()
</script>

<template>
  <div
    data-testid="supa-progress"
    :class="[progressVariants.wrapper({ size, error: status === 'error', background, class: ui?.wrapper })]"
  >
    <div
      :class="[progressVariants.progress({ color, infinite, class: ui?.progress })]"
      :style="{ width: !infinite ? `${width ? width : 0}%` : 'auto' }"
    />
  </div>
</template>

<style>
.animate-indeterminate-bar {
  animation: indeterminate-bar 1.5s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite normal none running;
}

@keyframes indeterminate-bar {
  0% {
    transform: translateX(-50%) scaleX(0.2);
  }

  100% {
    transform: translateX(100%) scaleX(1);
  }
}
</style>
