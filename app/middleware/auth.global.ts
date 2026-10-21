import { getRouteAccess } from "@shared/constants/public-routes";
import { ROUTES } from "@shared/constants/routes";
import { useUserStore, useInitApp } from "@features/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const access = getRouteAccess(to.path)

  // Marketing pages never need the session: skip init so no Supabase client is created.
  if (access === 'marketing') {
    return
  }

  const userStore = useUserStore()

  const {
    initializeApp
  } = useInitApp()

  if (!userStore.user && !userStore.initPromise) {
    userStore.setInitPromise(initializeApp())
    await userStore.initPromise!
    userStore.setInitPromise(null)
  }

  if (!userStore.user && access === 'app') {
    return navigateTo(`/login?redirectTo=${encodeURIComponent(to.fullPath)}`)
  }

  if (userStore.user && (to.path === ROUTES.LOGIN || to.path === ROUTES.SIGNUP || to.path === ROUTES.FORGOT_PASSWORD || to.path === ROUTES.CONFIRM)) {
    return navigateTo(ROUTES.HOME)
  }
})
