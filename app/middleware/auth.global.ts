import { publicRoutes } from "~/shared/constants/pablic-routes";
import { ROUTES } from "~/shared/constants/routes";
import { useInitApp } from "~/modules/auth/composables/init";
import { useUserStore } from "~/modules/auth/stores/user";

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore()

  const {
    initializeApp
  } = useInitApp()

  console.log('user', userStore.profile)
  if (!userStore.profile && !userStore.authReady) {
    console.log('initializeApp')
    await initializeApp()
  }

  const isPublic = publicRoutes.includes(to.path as (typeof publicRoutes)[number])
  if (!userStore.profile && !isPublic) {
    return navigateTo(`/login?redirectTo=${encodeURIComponent(to.fullPath)}`)
  }

  if (userStore.profile && (to.path === ROUTES.LOGIN || to.path === ROUTES.SIGNUP || to.path === ROUTES.FORGOT_PASSWORD || to.path === ROUTES.CONFIRM)) {
    return navigateTo(ROUTES.HOME)
  }
})