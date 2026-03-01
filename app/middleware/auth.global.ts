import { publicRoutes } from "~/shared/constants/pablic-routes";
import { ROUTES } from "~/shared/constants/routes";
import { useInitApp } from "~/auth/composables/init";
import { useUserStore } from "~/auth/stores/user";

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  console.log(user.value)
  const {
    initializeApp,
    isInitialized,
  } = useInitApp()

  if (!user.value && !isInitialized.value) {
    console.log('init')
    await initializeApp()
  }

  const isPublic = publicRoutes.includes(to.path as (typeof publicRoutes)[number])
  if (!user.value && !isPublic) {
    return navigateTo(`/login?redirectTo=${encodeURIComponent(to.fullPath)}`)
  }

  if (user.value && (to.path === ROUTES.LOGIN || to.path === ROUTES.SIGNUP)) {
    return navigateTo(ROUTES.HOME)
  }
})