<script setup lang="ts">
import type { DemoStepCopy } from '../demo-steps'

defineProps<{ copy: DemoStepCopy }>()
</script>

<template>
  <div>
    <span class="text-xs font-semibold text-primary-deep">{{ copy.number }}</span>
    <h3 class="mt-2.5 mb-3 text-[34px] leading-[1.1] font-semibold tracking-[-0.035em]">{{ copy.title }}</h3>
    <p class="text-base leading-[1.55] text-placeholder">{{ copy.text }}</p>
    <p class="mt-3.5 text-[13px] font-semibold text-primary-deep">{{ copy.hint }}</p>
  </div>
</template>
