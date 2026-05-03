<script lang="ts" setup>
import { tv } from 'tailwind-variants'
import { useAppSidebar } from "@entities/sidebar";
import logo from '@assets/images/logo.svg'
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
          <SupaIcon
            :ui="{ icon: 'shrink-0 size-[34px] text-[#fff] rounded-md' }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#9688CF"/>
              <path d="M10 3V8" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 3V8" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M23.6667 6H7.33333C6.04467 6 5 7.09441 5 8.44444V25.5556C5 26.9056 6.04467 28 7.33333 28H23.6667C24.9553 28 26 26.9056 26 25.5556V8.44444C26 7.09441 24.9553 6 23.6667 6Z" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 11H16H26" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11.6069 21.879V16.979C11.4869 17.0723 11.3536 17.1423 11.2069 17.189C11.0669 17.2357 10.8769 17.269 10.6369 17.289C10.4036 17.3023 10.0769 17.309 9.6569 17.309V15.799C9.95024 15.799 10.2036 15.7923 10.4169 15.779C10.6369 15.759 10.8236 15.709 10.9769 15.629C11.1369 15.5423 11.2736 15.4023 11.3869 15.209C11.5002 15.0157 11.6002 14.7457 11.6869 14.399H13.3469V21.879H11.6069Z" fill="white" stroke="none"/>
              <path d="M15.6999 15.3793L17.6033 15.3793C18.8554 15.3793 19.967 16.1805 20.363 17.3684L20.401 17.4824C20.594 18.0615 20.5755 18.6903 20.3488 19.2571C19.9569 20.2369 19.0079 20.8793 17.9527 20.8793L15.6999 20.8793" stroke="white" stroke-width="1.7" stroke-linejoin="round"/>
              <path d="M18.7769 25.89L19.1009 24.972C19.1179 24.923 19.1349 24.8815 19.1519 24.8475C19.1699 24.8135 19.1919 24.7875 19.2179 24.7695C19.2449 24.7515 19.2794 24.7425 19.3214 24.7425C19.3644 24.7425 19.3994 24.7515 19.4264 24.7695C19.4534 24.7875 19.4759 24.8135 19.4939 24.8475C19.5129 24.8805 19.5304 24.921 19.5464 24.969L19.8614 25.89H19.5944L19.5209 25.6515H19.1174L19.0409 25.89H18.7769ZM19.3184 25.032L19.1894 25.4295H19.4504L19.3274 25.032C19.3264 25.028 19.3249 25.026 19.3229 25.026C19.3209 25.026 19.3194 25.028 19.3184 25.032ZM20.9585 25.9125C20.9125 25.9125 20.8735 25.9 20.8415 25.875C20.8105 25.85 20.7805 25.8085 20.7515 25.7505L20.447 25.1355C20.446 25.1325 20.444 25.131 20.441 25.131C20.439 25.131 20.438 25.133 20.438 25.137V25.8885H20.189V24.933C20.189 24.871 20.207 24.824 20.243 24.792C20.28 24.759 20.323 24.7425 20.372 24.7425C20.422 24.7425 20.464 24.7555 20.498 24.7815C20.532 24.8075 20.561 24.8455 20.585 24.8955L20.87 25.4865C20.872 25.4895 20.874 25.491 20.876 25.491C20.878 25.49 20.879 25.4875 20.879 25.4835V24.765H21.128V25.7415C21.128 25.7995 21.1105 25.8425 21.0755 25.8705C21.0415 25.8985 21.0025 25.9125 20.9585 25.9125Z" fill="white" stroke="none"/>
              <path d="M15.5 25.35H16.4H18.5" stroke="white" stroke-width="1.3" stroke-linejoin="round"/>
              <path d="M15.2 14.52V26" stroke="white" stroke-width="1.7"/>
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
