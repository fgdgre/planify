<script setup lang="ts">
defineProps<{
  label: string
  tabFilled: boolean
  activeTab: boolean
}>()
</script>

<template>
  <button
    type="button"
    class="flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors"
    :class="[
          tabFilled
            ? 'bg-primary/60 border-border! text-foreground'
            : 'bg-placeholder/20 border-transparent text-secondary',
          activeTab
            ? 'border border-placeholder!'
            : 'text-placeholder',
        ]"
  >
    <slot>
      {{ label }}
    </slot>
  </button>
</template>

<style scoped>

</style>
