<script setup lang="ts">
import { useAppSidebar, AppSidebar } from "@entities/sidebar";
import NoteSidebar from '@features/notes/components/NoteSidebar.vue'

const route = useRoute()

const layoutTitle = computed(() => route.meta.title)

const sidebarStore = useAppSidebar()
const { isSidebarCollapsed } = storeToRefs(sidebarStore)
</script>

<template>
  <div
    class="layout"
    :class="[isSidebarCollapsed && 'layout--collapsed']"
  >
    <AppSidebar />
    <NoteSidebar />

    <main class="main pl-[var(--sidebar-width)]">
      <h1 class="text-2xl font-medium p-4 pb-4 border-b border-border">{{ layoutTitle }}</h1>
      <div class="overflow-hidden flex flex-col flex-1">
        <slot />
      </div>
    </main>
  </div>
</template>

<style>
.layout {
  --sidebar-full-width: 250px;
  --sidebar-icon-width: 50px;
  --sidebar-width: var(--sidebar-full-width);

  transition: transform 0.25s ease-in;
}

.layout--collapsed {
  --sidebar-width: var(--sidebar-icon-width);
}

.layout--mobile main {
  padding-left: 0;
}

.main {
  transition: padding 0.25s ease-in-out;
  will-change: transform, padding;
  display: flex;
  flex-direction: column;
  height: 100svh;
}

.sidebar {
  transition: inline-size 0.25s ease-in-out, transform 0.25s ease-in-out;
  will-change: transform, inline-size;
}

.data-\[state\=open\]\:animate-slideDown[data-state='open'] {
  animation: slideDown 0.25s ease;
}

.data-\[state\=closed\]\:animate-slideUp[data-state='closed'] {
  animation: slideUp 0.25s ease;
}
</style>
