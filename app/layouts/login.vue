<script setup lang="ts">
const route = useRoute()

const layoutTitle = computed(() => route.meta.layoutTitle)
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-80 w-[calc(100%-64px)] mx-auto gap-5">
    <h1 class="text-2xl font-bold mb-4">{{ layoutTitle }}</h1>

    <slot />
  </div>
</template>