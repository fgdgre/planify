<script setup lang="ts">
defineProps<{
  icon?: string
  height?: number
  ui?: { wrapper?: string }
}>()

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <div v-if="icon" class="flex items-center" :class="[ui?.wrapper]" :style="[height ? `height: ${height + 'px'}` : '']">
    <SupaIcon v-bind="$attrs" :name="icon" :ui="{ icon: 'text-skeleton animate-pulse size-6' }" mode="svg" />
  </div>

  <div v-else class="flex items-center" :class="[ui?.wrapper]" :style="[height ? `height: ${height + 'px'}` : '']">
    <div v-bind="$attrs" class="bg-skeleton animate-pulse"></div>
  </div>
</template>
