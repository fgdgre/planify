
<script lang="ts" setup>
import { tv } from 'tailwind-variants'
import AppSidebarItemIcon from "./AppSidebarItemIcon.vue";
import { sidebarVariants } from '@shared/ui/sidebar'
import { resolveAppPath } from '@shared/api/demo'

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

const target = computed(() => resolveAppPath(props.link))
const isActive = computed(() => useRoute().path.includes(target.value))
</script>


<template>
  <NuxtLink :class="[sidebarGroupItem({ subListItem, activeItem: isActive, wrap })]" :to="target" :data-testid="testId">
    <AppSidebarItemIcon v-if="icon || defaultIcon" :icon />

    <p class="py-1">
      {{ name }}
    </p>
  </NuxtLink>
</template>
