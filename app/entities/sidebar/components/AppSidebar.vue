<script lang="ts" setup>
import { tv } from 'tailwind-variants'
import { type SidebarSection, useAppSidebar } from "@entities/sidebar";
import { sidebarVariants } from '@shared/ui/sidebar'
import { useLogout, useUserStore } from "@features/auth";
import AppSidebarContent from "@entities/sidebar/components/AppSidebarContent.vue";

const sidebarStore = useAppSidebar()
const { isSidebarCollapsed, sections } = storeToRefs(sidebarStore)

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const userInfo = computed(() => ({
  name: (user.value?.first_name || 'Unknown') + ' ' + (user.value?.last_name || 'User'),
  email: user.value?.email,
}))

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
          <SupaIcon
            :ui="{ icon: 'shrink-0 size-[34px] text-[#fff] rounded-md' }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79 45" fill="none">
              <path d="M1.25027 1.00026C1.25027 1.00026 34.0346 11.0003 39.0019 11.0003C43.9692 11.0003 77.2503 1.00026 77.2503 1.00026" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M1.00027 22.5003L77.0003 22.0003" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M1.50027 9.00026C1.50027 9.00026 34.2846 18.0003 39.2519 18.0003C44.2192 18.0003 77.5003 9.00026 77.5003 9.00026" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M77.0003 36.0003C77.0003 36.0003 44.216 27.0003 39.2486 27.0003C34.2813 27.0003 1.00027 36.0003 1.00027 36.0003" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M77.0003 44.0003C77.0003 44.0003 44.216 33.0003 39.2486 33.0003C34.2813 33.0003 1.00027 44.0003 1.00027 44.0003" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M1.00027 16.0003C1.00027 16.0003 33.7846 21.0003 38.7519 21.0003C43.7192 21.0003 77.0003 16.0003 77.0003 16.0003" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M77.0003 29.0003C77.0003 29.0003 44.216 24.0003 39.2486 24.0003C34.2813 24.0003 1.00027 29.0003 1.00027 29.0003" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </SupaIcon>
        </div>
      </div>

      <div class="flex items-center justify-between w-full">
        <p class="font-medium">Planify</p>
      </div>
    </div>
    <div :class="[sidebarMainContent({ noPadding: true, class: 'flex flex-col justify-between' })]">
      <AppSidebarContent
        :sections
        :collapse-sections="isSidebarCollapsed && (!isSidebarHovered || !showOnHover)"
        @link-click="$emit('linkClicked')"
        @toggle-section="(e) => $emit('toggleSection', e)"
      />
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
