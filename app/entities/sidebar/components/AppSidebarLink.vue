
<script lang="ts" setup>
import { tv } from 'tailwind-variants'
import AppSidebarItemIcon from "./AppSidebarItemIcon.vue";
import { sidebarVariants } from '@shared/ui/sidebar'
import { resolveAppPath, useTourTarget } from '@shared/api/demo'
import { ROUTES } from '@shared/constants/routes'
import { isSidebarLinkActive } from '../helpers/is-link-active'

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
const route = useRoute()
const linkRef = useTemplateRef('linkRef')
if (props.link === ROUTES.HOME) useTourTarget('dashboardNav', linkRef)
const isActive = computed(() => isSidebarLinkActive(route.path, target.value, resolveAppPath(ROUTES.HOME)))
</script>


<template>
  <NuxtLink ref="linkRef" :class="[sidebarGroupItem({ subListItem, activeItem: isActive, wrap })]" :to="target" :data-testid="testId">
    <AppSidebarItemIcon v-if="icon || defaultIcon" :icon />

    <p class="py-1">
      {{ name }}
    </p>
  </NuxtLink>
</template>
