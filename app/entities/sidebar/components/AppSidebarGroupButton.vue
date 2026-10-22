<script setup lang="ts">
import { tv } from 'tailwind-variants'
import { sidebarVariants } from '@shared/ui/sidebar'
import { resolveAppPath, useTourTarget } from '@shared/api/demo'
import { ROUTES } from '@shared/constants/routes'
import AppSidebarItemIcon from './AppSidebarItemIcon.vue'

const props = defineProps<{
  name: string
  open?: boolean
  icon?: string
  link?: string
  collapseSections?: boolean
  subListItem?: boolean
  activeItem?: boolean
  iconSize?: 'lg'
  testId?: string
}>()

const buttonRef = useTemplateRef('buttonRef')
// The tour clicks the Dashboard item with its ghost cursor.
if (props.link === ROUTES.HOME) useTourTarget('dashboardNav', buttonRef)

const sidebarGroupItem = computed(() => tv({ extend: sidebarVariants.groupItem }))

const target = computed(() => (props.link ? resolveAppPath(props.link) : undefined))

const isActive = computed(() => {
  if (target.value) {
    return useRoute().path === target.value
  }
})

const handleLinkClick = () => {
  if (target.value) {
    navigateTo(target.value)
  }
}
</script>

<template>
  <button
    ref="buttonRef"
    @click="handleLinkClick"
    :class="[
      sidebarGroupItem({
        subListItem,
        activeItem: isActive,
        class: ['mt-0 pl-[6.5px] h-[33px]', collapseSections && 'p-0 w-[33px] overflow-hidden pl-[6.5px]'],
      }),
    ]"
    :data-testid="testId"
  >
    <AppSidebarItemIcon :icon :default-icon="!icon" group />
    <Transition>
      <div v-if="!collapseSections" class="flex items-center w-full">
        <span class="py-1">
          {{ name }}
        </span>

        <Icon
          v-if="!link"
          :name="'heroicons:chevron-right'"
          mode="svg"
          class="ml-auto size-4 rotate-0 transition-transform text-sidebar-foreground"
          :class="[open && 'rotate-90']"
        />
      </div>
    </Transition>
  </button>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: all 0.2s ease;
}
</style>
