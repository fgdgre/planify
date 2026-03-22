
<script lang="ts" setup>
import { tv } from 'tailwind-variants'
import AppSidebarItemIcon from "./AppSidebarItemIcon.vue";
import { sidebarVariants } from '@shared/ui/sidebar'

const props = defineProps<{
  name: string
  icon?: string
  link: string
  defaultIcon?: boolean
  subListItem?: boolean
  activeItem?: boolean
  wrap?: boolean
  testId?: string
}>()

const sidebarGroupItem = computed(() => tv({ extend: sidebarVariants.groupItem }))

const isActive = computed(() => useRoute().path.includes(props.link))
</script>


<template>
  <NuxtLink :class="[sidebarGroupItem({ subListItem, activeItem: isActive, wrap })]" :to="link" :data-testid="testId">
    <AppSidebarItemIcon v-if="icon || defaultIcon" :icon />

    <p class="py-1">
      {{ name }}
    </p>
  </NuxtLink>
</template>
