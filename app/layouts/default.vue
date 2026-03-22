<script setup lang="ts">
import { useAppSidebar, AppSidebar } from "@entities/sidebar";

const route = useRoute()

const layoutTitle = computed(() => route.meta.title)

const sidebarStore = useAppSidebar()
const { isSidebarCollapsed } = storeToRefs(sidebarStore)
</script>

<template>
  <main class="main pl-[var(--sidebar-width)]">
    <slot />
  </main>
</template>
