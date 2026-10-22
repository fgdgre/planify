<script lang="ts" setup>
import { tv } from 'tailwind-variants'
import { useAppSidebar } from "@entities/sidebar";
import logo from '@assets/images/logo.svg'
import { sidebarVariants } from '@shared/ui/sidebar'
import { useLogout, useUserStore } from "@features/auth";
import AppSidebarContent from "@entities/sidebar/components/AppSidebarContent.vue";
import AppSidebarCalendars from "@entities/sidebar/components/AppSidebarCalendars.vue";

const sidebarStore = useAppSidebar()
const { isSidebarCollapsed, sections } = storeToRefs(sidebarStore)

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const userInfo = computed(() => {
  const meta = user.value?.user_metadata
  const firstName = meta?.first_name?.trim() ?? ''
  const lastName = meta?.last_name?.trim() ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const email = user.value?.email ?? meta?.email ?? ''

  return {
    name: fullName || email || 'Unknown user',
    email,
  }
})

defineEmits<{
  toggleCollapsed: []
  toggleSection: [{ name: string; value: boolean }]
  linkClicked: []
  logout: []
}>()

const { loading: logoutLoading, logout } = useLogout()

const showOnHover = ref(true)

const isSidebarHovered = ref(false)

const setHover = (value: boolean) => {
  if (isSidebarHovered.value === value) return

  isSidebarHovered.value = value
}

const sidebarWrapper = computed(() => tv({ extend: sidebarVariants.wrapper }))

const sidebarMainContent = computed(() => tv({ extend: sidebarVariants.mainContent }))

const sidebarTitle = computed(() => tv({ extend: sidebarVariants.title }))

const sidebarFooterWrapper = computed(() =>
  tv({
    base: 'flex items-center w-full p-4 pr-2 gap-x-2 text-sidebar-foreground overflow-hidden transition-all',
    variants: {
      open: {
        true: 'px-2',
        false: '',
      },
    },
  })
)
</script>


<template>
  <aside
    :class="[
      sidebarWrapper({
        theme: 'black',
        class: [
          'sidebar w-[var(--sidebar-width)] overflow-hidden',
          showOnHover && 'hover:w-[var(--sidebar-full-width)]',
        ],
      }),
    ]"
    @mouseenter="setHover(true)"
    @mouseleave="setHover(false)"
    data-testid="supa-app-sidebar"
  >
    <div
      :class="[
        sidebarTitle({
          open: isSidebarCollapsed && (!isSidebarHovered || !showOnHover),
          class: 'pl-2 overflow-hidden',
        }),
      ]"
    >
      <div class="mr-2">
        <div class="rounded-md size-[33px] grid place-content-center">
          <SupaLogo class="size-[34px] shrink-0 rounded-md" />
        </div>
      </div>

      <div class="flex items-center justify-between w-full">
        <p class="font-medium text-white">Planify</p>
      </div>
    </div>
    <div :class="[sidebarMainContent({ noPadding: true, class: 'flex flex-col justify-between' })]">
      <div class="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <AppSidebarContent
          :sections
          :collapse-sections="isSidebarCollapsed && (!isSidebarHovered || !showOnHover)"
          @link-click="$emit('linkClicked')"
          @toggle-section="(e) => $emit('toggleSection', e)"
        />
        <AppSidebarCalendars />
      </div>
    </div>
    <footer :class="[sidebarFooterWrapper({ open: isSidebarCollapsed && (!isSidebarHovered || !showOnHover) })]">
      <SupaIcon :ui="{ icon: 'size-[33px] shrink-0' }" name="mingcute:user-4-fill" />
      <!-- :class="[isSidebarCollapsed && !isSidebarHovered && 'w-[32px]']" -->

      <div class="overflow-hidden w-full">
        <p class="font-semibold text-[12px] truncate">{{ userInfo?.name }}</p>
        <p class="text-[12px] text-sidebar-foreground/70 truncate">{{ userInfo?.email }}</p>
      </div>

      <SupaButton
        icon="material-symbols:logout"
        stretch="height"
        :loading="logoutLoading"
        variant="transparent"

        test-id="logout-button"
        :ui="{ button: 'col-start-3 row-span-2 text-sidebar-foreground/70 p-0 shrink-0', icon: 'size-5' }"
        @click="logout"
      />
    </footer>
  </aside>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: all 0.1s ease;
}
</style>
