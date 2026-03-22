
<script setup lang="ts">
defineProps<{
  icon?: string
  group?: boolean
}>()
</script>

<template>
  <Icon
    v-if="icon"
    :name="icon"
    class="shrink-0 text-sidebar-foreground"
    mode="svg"
    :class="[group ? 'size-5' : 'size-4']"
  />
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    width="14px"
    height="14px"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
    :class="[group ? 'size-5' : 'size-4']"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
</template>
