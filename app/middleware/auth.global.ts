import { publicRoutes } from "@constants/pablic-routes";
import { ROUTES } from "@constants/routes";
import { useUserStore, useInitApp } from "@modules/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore()

  const {
    initializeApp
  } = useInitApp()

  console.log('user', userStore.user)
  if (!userStore.user && !userStore.initPromise) {
    console.log('initializeApp')
    userStore.setInitPromise(initializeApp())
    await userStore.initPromise
    userStore.setInitPromise(null)
  }

  const path = to.path !== '/' ? to.path.replace(/\/+$/, '') : '/'
  const isPublic = publicRoutes.includes(path as (typeof publicRoutes)[number])
  if (!userStore.user && !isPublic) {
    return navigateTo(`/login?redirectTo=${encodeURIComponent(to.fullPath)}`)
  }

  if (userStore.user && (to.path === ROUTES.LOGIN || to.path === ROUTES.SIGNUP || to.path === ROUTES.FORGOT_PASSWORD || to.path === ROUTES.CONFIRM)) {
    return navigateTo(ROUTES.HOME)
  }
})